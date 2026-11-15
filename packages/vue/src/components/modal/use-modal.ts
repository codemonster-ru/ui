import { cmFocusableSelector } from '@codemonster-ru/ui-runtime/core';
import { nextTick, onMounted, ref, watch, type Ref } from 'vue';

function availableFocusCandidates(dialog: HTMLDialogElement, selector: string): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(selector)].filter(
    (element) =>
      !element.matches(':disabled, input[type="hidden"]') &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

export interface CmModalBinding {
  dialog: Ref<HTMLDialogElement | undefined>;
  localOpen: Ref<boolean>;
  onCancel: (event: Event) => void;
  onClose: () => void;
  onKeydown: (event: KeyboardEvent, allowEscape?: boolean) => void;
  setOpen: (open: boolean, restoreFocus?: boolean) => void;
}

export function useCmModal(open: () => boolean, emitOpen: (open: boolean) => void): CmModalBinding {
  const dialog = ref<HTMLDialogElement>();
  const localOpen = ref(open());
  let returnFocus: HTMLElement | null = null;

  watch(open, (next) => synchronize(next));
  onMounted(() => synchronize(open(), false));

  function setOpen(next: boolean, restoreFocus = true): void {
    if (localOpen.value === next) return;
    synchronize(next, restoreFocus);
    emitOpen(next);
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
      if (typeof element.showModal === 'function') {
        if (!element.matches(':modal')) {
          // SSR renders open content before hydration. Remove its non-modal open state before
          // entering the browser's modal stack, which owns the backdrop and outside focus.
          element.removeAttribute('open');
          element.showModal();
        }
      } else {
        element.open = true;
      }
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
      returnFocus = null;
    }
  }

  function onCancel(event: Event): void {
    event.preventDefault();
    setOpen(false);
  }

  function onClose(): void {
    // Native close may arrive after a subsequent open; the current element state wins.
    if (dialog.value?.open === false) setOpen(false);
  }

  function onKeydown(event: KeyboardEvent, allowEscape = true): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (allowEscape) setOpen(false);
      return;
    }
    const element = dialog.value;
    if (event.key !== 'Tab' || !element || !localOpen.value) return;
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

  return { dialog, localOpen, onCancel, onClose, onKeydown, setOpen };
}
