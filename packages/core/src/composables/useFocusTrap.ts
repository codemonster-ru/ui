import {
  onBeforeUnmount,
  onMounted,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type WatchStopHandle,
} from 'vue';

export interface UseFocusTrapOptions {
  enabled?: MaybeRefOrGetter<boolean>;
}

interface FocusScopeEntry {
  target: Ref<HTMLElement | null>;
  activationOrder: number;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const activeTraps: FocusScopeEntry[] = [];
const activeBranches: FocusScopeEntry[] = [];
let activationOrder = 0;
let documentListener: ((event: KeyboardEvent) => void) | null = null;

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('hidden') &&
      !element.closest('[inert]') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      !element.closest('[aria-hidden="true"]'),
  );
}

function removeActiveEntry(entries: FocusScopeEntry[], entry: FocusScopeEntry) {
  const index = entries.indexOf(entry);

  if (index >= 0) {
    entries.splice(index, 1);
  }
}

function getTopmostTrap() {
  return activeTraps.reduce<FocusScopeEntry | null>(
    (current, candidate) =>
      current === null || candidate.activationOrder > current.activationOrder ? candidate : current,
    null,
  );
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab' || event.defaultPrevented) {
    return;
  }

  const trap = getTopmostTrap();
  const container = trap?.target.value;

  if (!trap || !container) {
    return;
  }

  const branchContainers = activeBranches
    .filter((branch) => branch.activationOrder > trap.activationOrder)
    .sort((left, right) => left.activationOrder - right.activationOrder)
    .map((branch) => branch.target.value)
    .filter((branch): branch is HTMLElement => branch instanceof HTMLElement);
  const focusableElements = [container, ...branchContainers].flatMap(getFocusableElements);

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;
  const activeIsInScope =
    container.contains(activeElement) || branchContainers.some((branch) => branch.contains(activeElement));

  if (!activeIsInScope) {
    event.preventDefault();
    (event.shiftKey ? lastElement : firstElement).focus();
    return;
  }

  if (event.shiftKey && (activeElement === firstElement || activeElement === container)) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function refreshDocumentListener() {
  if (activeTraps.length > 0 && !documentListener && typeof document !== 'undefined') {
    documentListener = handleDocumentKeydown;
    document.addEventListener('keydown', documentListener);
    return;
  }

  if (activeTraps.length === 0 && documentListener && typeof document !== 'undefined') {
    document.removeEventListener('keydown', documentListener);
    documentListener = null;
  }
}

function useActiveFocusEntry(
  entries: FocusScopeEntry[],
  entry: FocusScopeEntry,
  enabled: MaybeRefOrGetter<boolean> | undefined,
) {
  let stopEnabledWatch: WatchStopHandle | undefined;

  onMounted(() => {
    stopEnabledWatch = watch(
      () => toValue(enabled) !== false,
      (active) => {
        removeActiveEntry(entries, entry);
        if (active) {
          entry.activationOrder = ++activationOrder;
          entries.push(entry);
        }
        refreshDocumentListener();
      },
      { immediate: true, flush: 'sync' },
    );
  });

  onBeforeUnmount(() => {
    stopEnabledWatch?.();
    removeActiveEntry(entries, entry);
    refreshDocumentListener();
  });
}

export function useFocusTrap(target: Ref<HTMLElement | null>, options: UseFocusTrapOptions = {}) {
  useActiveFocusEntry(activeTraps, { target, activationOrder: 0 }, options.enabled);
}

/** Registers a teleported focusable subtree as part of the currently active modal focus scope. */
export function useFocusScopeBranch(target: Ref<HTMLElement | null>, enabled: MaybeRefOrGetter<boolean>) {
  useActiveFocusEntry(activeBranches, { target, activationOrder: 0 }, enabled);
}
