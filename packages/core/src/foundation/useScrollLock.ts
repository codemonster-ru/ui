import { onBeforeUnmount, toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

export interface UseScrollLockOptions {
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

interface ScrollLockState {
  count: number;
  overflow: string;
  paddingRight: string;
}

const scrollLocks = new WeakMap<HTMLElement, ScrollLockState>();

function acquireScrollLock(target: HTMLElement) {
  const current = scrollLocks.get(target);

  if (current) {
    current.count += 1;
    return;
  }

  const state: ScrollLockState = {
    count: 1,
    overflow: target.style.overflow,
    paddingRight: target.style.paddingRight,
  };

  scrollLocks.set(target, state);
  target.style.overflow = 'hidden';

  if (typeof document !== 'undefined' && target === document.body) {
    const scrollbarWidth = Math.max(window.innerWidth - document.documentElement.clientWidth, 0);

    if (scrollbarWidth > 0) {
      const computedPaddingRight = Number.parseFloat(window.getComputedStyle(target).paddingRight || '0');
      target.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    }
  }
}

function releaseScrollLock(target: HTMLElement) {
  const state = scrollLocks.get(target);

  if (!state) {
    return;
  }

  state.count -= 1;
  if (state.count > 0) {
    return;
  }

  target.style.overflow = state.overflow;
  if (typeof document !== 'undefined' && target === document.body) {
    target.style.paddingRight = state.paddingRight;
  }
  scrollLocks.delete(target);
}

export function useScrollLock(enabled: MaybeRefOrGetter<boolean>, options: UseScrollLockOptions = {}) {
  let lockedTarget: HTMLElement | null = null;

  const resolveTarget = () => {
    const target = toValue(options.target);

    if (target) {
      return target;
    }

    if (typeof document === 'undefined') {
      return null;
    }

    return document.body;
  };

  const unlock = () => {
    if (!lockedTarget) {
      return;
    }

    releaseScrollLock(lockedTarget);
    lockedTarget = null;
  };

  watchEffect((onCleanup) => {
    const isEnabled = toValue(enabled);
    const target = resolveTarget();

    if (!target || !isEnabled) {
      unlock();
      return;
    }

    if (lockedTarget !== target) {
      unlock();
      acquireScrollLock(target);
      lockedTarget = target;
    }

    onCleanup(unlock);
  });

  onBeforeUnmount(unlock);

  return {
    unlock,
  };
}
