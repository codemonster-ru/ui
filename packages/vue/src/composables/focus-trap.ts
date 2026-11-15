import { cmFocusableSelector } from '@codemonster-ru/ui-runtime/core';
import { onBeforeUnmount, onMounted, toValue, watch, type MaybeRefOrGetter, type Ref, type WatchStopHandle } from 'vue';

export interface UseFocusTrapOptions {
  enabled?: MaybeRefOrGetter<boolean>;
}

type FocusTarget = () => HTMLElement | null;

interface FocusTrapStack {
  targets: FocusTarget[];
  listener: (event: KeyboardEvent) => void;
}

const focusTrapStacks = new WeakMap<Document, FocusTrapStack>();

function tabStops(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(cmFocusableSelector)]
    .filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled, input[type="hidden"]') &&
        !element.closest('[hidden], [inert], [aria-hidden="true"], dialog:not([open])') &&
        element.checkVisibility?.({ visibilityProperty: true }) !== false,
    )
    .sort((left, right) => (left.tabIndex || Number.MAX_SAFE_INTEGER) - (right.tabIndex || Number.MAX_SAFE_INTEGER));
}

function containTab(event: KeyboardEvent, container: HTMLElement, owner: Document): void {
  const active = owner.activeElement;
  const dialog = active?.closest('dialog[open]');
  if (
    dialog &&
    !dialog.contains(container) &&
    owner.defaultView?.CSS?.supports('selector(:modal)') &&
    dialog.matches(':modal')
  ) {
    return;
  }

  const stops = tabStops(container);
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) {
    event.preventDefault();
    container.focus();
  } else if (
    !container.contains(active) ||
    active === (event.shiftKey ? first : last) ||
    (event.shiftKey && active === container)
  ) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

function registerTrap(owner: Document, target: FocusTarget): () => void {
  let stack = focusTrapStacks.get(owner);
  if (!stack) {
    const targets: FocusTarget[] = [];
    function listener(event: KeyboardEvent): void {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const container = targets[targets.length - 1]?.();
      if (container?.isConnected) containTab(event, container, owner);
    }

    stack = { targets, listener };
    focusTrapStacks.set(owner, stack);
    owner.addEventListener('keydown', listener);
  }

  const { targets, listener } = stack;
  targets.push(target);
  return () => {
    targets.splice(targets.indexOf(target), 1);
    if (targets.length === 0) {
      owner.removeEventListener('keydown', listener);
      focusTrapStacks.delete(owner);
    }
  };
}

export function useFocusTrap(target: Ref<HTMLElement | null>, options: UseFocusTrapOptions = {}): void {
  let stop: WatchStopHandle | undefined;
  onMounted(() => {
    stop = watch(
      () => (toValue(options.enabled) === false ? undefined : target.value?.ownerDocument),
      (owner, _previous, onCleanup) => {
        if (owner) onCleanup(registerTrap(owner, () => target.value));
      },
      { immediate: true, flush: 'sync' },
    );
  });
  onBeforeUnmount(() => stop?.());
}
