import { cmFocusableSelector } from '@codemonster-ru/ui-runtime/core';
import { enterCmNativeModal, releaseCmOverlayFocus } from '@codemonster-ru/ui-runtime/native-modal';
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

function availableFocusCandidates(dialog: HTMLDialogElement, selector: string): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(selector)].filter(
    (element) =>
      element.closest('dialog') === dialog &&
      !element.matches(':disabled, input[type="hidden"]') &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

export interface CmModalBinding {
  dialog: Ref<HTMLDialogElement | undefined>;
  localOpen: Ref<boolean>;
  onCancel: (event: Event, allowEscape?: boolean) => void;
  onClose: () => void;
  onKeydown: (event: KeyboardEvent, allowEscape?: boolean) => void;
  setOpen: (open: boolean, restoreFocus?: boolean) => void;
  restoreAfterMove: () => (() => void) | undefined;
}

export function useCmModal(
  open: () => boolean | undefined,
  emitOpen: (open: boolean) => void,
  defaultOpen = false,
): CmModalBinding {
  const dialog = ref<HTMLDialogElement>();
  const localOpen = ref(open() ?? defaultOpen);
  let returnFocus: HTMLElement | null = null;
  let releaseScroll: (() => void) | undefined;

  watch(open, (next) => {
    if (next !== undefined) synchronize(next);
  });
  onMounted(() => synchronize(localOpen.value, false));
  onBeforeUnmount(() => {
    const element = dialog.value;
    if (!element || !localOpen.value) return;
    const { activeElement, body } = element.ownerDocument;
    synchronize(false, activeElement === body || element.contains(activeElement));
  });

  function setOpen(next: boolean, restoreFocus = true): void {
    if (localOpen.value === next) return;
    synchronize(next, restoreFocus);
    emitOpen(next);
  }

  function enter(element: HTMLDialogElement): void {
    releaseScroll = enterCmNativeModal(element, releaseScroll);
    if (!releaseScroll) element.open = true;
  }

  function restoreAfterMove(): (() => void) | undefined {
    const element = dialog.value;
    if (!element || !localOpen.value) return;
    const owner = element.ownerDocument;
    const focused = owner.activeElement;
    const HTMLElementConstructor = owner.defaultView?.HTMLElement;
    return () => {
      if (!localOpen.value || element !== dialog.value || !element.isConnected) return;
      enter(element);
      if (HTMLElementConstructor && focused instanceof HTMLElementConstructor && element.contains(focused)) {
        focused.focus({ preventScroll: true });
      }
    };
  }

  function synchronize(next: boolean, restoreFocus = true): void {
    const element = dialog.value;
    localOpen.value = next;
    if (!element) return;
    if (next) {
      const active = element.ownerDocument.activeElement;
      const HTMLElementConstructor = element.ownerDocument.defaultView?.HTMLElement;
      if (HTMLElementConstructor && active instanceof HTMLElementConstructor && !element.contains(active)) {
        returnFocus = active;
      }
      enter(element);
      void nextTick(() => {
        if (!localOpen.value) return;
        (
          availableFocusCandidates(element, '[autofocus]')[0] ??
          availableFocusCandidates(element, '[data-autofocus]')[0] ??
          availableFocusCandidates(element, cmFocusableSelector).find((candidate) => candidate.tabIndex >= 0) ??
          element
        ).focus();
      });
    } else {
      if (typeof element.close === 'function' && element.open) element.close();
      else element.open = false;
      if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
      releaseCmOverlayFocus(element);
      returnFocus = null;
      releaseScroll?.();
      releaseScroll = undefined;
    }
  }

  function onCancel(event: Event, allowEscape = true): void {
    event.preventDefault();
    if (allowEscape) setOpen(false);
  }

  function onClose(): void {
    // Native close may arrive after a subsequent open; the current element state wins.
    if (dialog.value?.open === false) setOpen(false);
  }

  function onKeydown(event: KeyboardEvent, allowEscape = true): void {
    const element = dialog.value;
    const ElementConstructor = element?.ownerDocument.defaultView?.Element;
    if (!element?.open || !localOpen.value || !ElementConstructor || !(event.target instanceof ElementConstructor))
      return;
    if (event.target.closest('dialog') !== element) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (allowEscape) setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = availableFocusCandidates(element, cmFocusableSelector).filter(
      (candidate) => candidate.tabIndex >= 0,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      element.focus();
    } else if (event.shiftKey && element.ownerDocument.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && element.ownerDocument.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { dialog, localOpen, onCancel, onClose, onKeydown, setOpen, restoreAfterMove };
}
