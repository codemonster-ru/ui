import { onBeforeUnmount, toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

export interface UseScrollLockOptions {
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

export function useScrollLock(enabled: MaybeRefOrGetter<boolean>, options: UseScrollLockOptions = {}) {
  let previousOverflow = '';
  let previousPaddingRight = '';

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
    const target = resolveTarget();

    if (!target) {
      return;
    }

    target.style.overflow = previousOverflow;

    if (typeof document !== 'undefined' && target === document.body) {
      target.style.paddingRight = previousPaddingRight;
    }
  };

  watchEffect((onCleanup) => {
    const isEnabled = toValue(enabled);
    const target = resolveTarget();

    if (!target) {
      return;
    }

    if (!isEnabled) {
      unlock();
      return;
    }

    previousOverflow = target.style.overflow;
    previousPaddingRight = target.style.paddingRight;
    target.style.overflow = 'hidden';

    if (typeof document !== 'undefined' && target === document.body) {
      const scrollbarWidth = Math.max(window.innerWidth - document.documentElement.clientWidth, 0);

      if (scrollbarWidth > 0) {
        const computedPaddingRight = Number.parseFloat(window.getComputedStyle(target).paddingRight || '0');
        const nextPaddingRight = computedPaddingRight + scrollbarWidth;
        target.style.paddingRight = `${nextPaddingRight}px`;
      }
    }

    onCleanup(() => {
      target.style.overflow = previousOverflow;
      if (typeof document !== 'undefined' && target === document.body) {
        target.style.paddingRight = previousPaddingRight;
      }
    });
  });

  onBeforeUnmount(() => {
    unlock();
  });

  return {
    unlock,
  };
}
