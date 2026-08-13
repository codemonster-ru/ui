import { nextTick, onMounted, ref, watch, type Ref } from 'vue';

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface CmModalBinding {
  dialog: Ref<HTMLDialogElement | undefined>;
  localOpen: Ref<boolean>;
  onCancel: (event: Event) => void;
  onKeydown: (event: KeyboardEvent) => void;
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
      if (typeof element.showModal === 'function' && !element.open) element.showModal();
      else element.open = true;
      void nextTick(() => {
        if (!localOpen.value) return;
        (
          element.querySelector<HTMLElement>('[autofocus]') ??
          element.querySelector<HTMLElement>(focusableSelector) ??
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

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    const element = dialog.value;
    if (event.key !== 'Tab' || !element || !localOpen.value) return;
    const focusable = [...element.querySelectorAll<HTMLElement>(focusableSelector)];
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

  return { dialog, localOpen, onCancel, onKeydown, setOpen };
}
