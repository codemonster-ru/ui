import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

export interface UseScrollLockOptions {
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

interface ScrollLock {
  owners: number;
  restore: () => void;
}

const locks = new WeakMap<HTMLElement, ScrollLock>();
const overflowProperties = ['overflow', 'overflow-x', 'overflow-y'];

function applyScrollLock(target: HTMLElement): () => void {
  const { ownerDocument: owner, style } = target;
  const view = owner.defaultView;
  const viewportWidth = target === owner.body && view ? owner.documentElement.clientWidth : 0;
  const scrollbarWidth = view && viewportWidth ? view.innerWidth - viewportWidth : 0;
  const bodyPadding =
    view && scrollbarWidth > 0 ? Number.parseFloat(view.getComputedStyle(target).paddingRight) || 0 : undefined;
  const properties = bodyPadding === undefined ? overflowProperties : [...overflowProperties, 'padding-right'];
  const previous = properties.map((name) => ({
    name,
    value: style.getPropertyValue(name),
    priority: style.getPropertyPriority(name),
  }));
  const overflowPriority = previous.some(({ name, priority }) => name !== 'padding-right' && priority === 'important')
    ? 'important'
    : '';

  for (const name of overflowProperties) style.removeProperty(name);
  style.setProperty('overflow', 'hidden', overflowPriority);
  if (bodyPadding !== undefined) {
    style.setProperty('padding-right', `${bodyPadding + scrollbarWidth}px`, style.getPropertyPriority('padding-right'));
  }

  return () => {
    for (const name of properties) style.removeProperty(name);
    for (const { name, value, priority } of previous) if (value) style.setProperty(name, value, priority);
  };
}

function acquireScrollLock(target: HTMLElement): () => void {
  const lock = locks.get(target) ?? { owners: 0, restore: applyScrollLock(target) };
  locks.set(target, lock);
  lock.owners += 1;

  return () => {
    lock.owners -= 1;
    if (lock.owners > 0) return;
    locks.delete(target);
    lock.restore();
  };
}

export function useScrollLock(
  enabled: MaybeRefOrGetter<boolean>,
  options: UseScrollLockOptions = {},
): { unlock: () => void } {
  let release: (() => void) | undefined;

  function unlock(): void {
    release?.();
    release = undefined;
  }

  watchEffect((onCleanup) => {
    if (!toValue(enabled) || typeof document === 'undefined') return;
    const target = toValue(options.target) ?? document.body;
    if (!target) return;
    release = acquireScrollLock(target);
    onCleanup(unlock);
  });

  return { unlock };
}
