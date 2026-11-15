import { onMounted, onUpdated, watch, type Ref } from 'vue';

/** Run after the browser resets the control's current form. */
type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;

export function useCmFormReset(control: Ref<FormControl | null>, reset: () => void): void {
  watch(control, (element, _, onCleanup) => {
    if (!element) return;
    const document = element.ownerDocument;
    const onReset = (event: Event): void => {
      if (event.target !== element.form) return;
      // The reset event can still be canceled, and precedes the native reset.
      setTimeout(() => {
        if (
          !event.defaultPrevented &&
          element.isConnected &&
          element === control.value &&
          event.target === element.form
        )
          reset();
      });
    };
    document.addEventListener('reset', onReset, true);
    onCleanup(() => document.removeEventListener('reset', onReset, true));
  });
}

/** Keep the native reset default while Vue reflects live bindings into DOM attributes. */
export function useCmNativeFormReset<T extends string | boolean>(
  control: Ref<HTMLInputElement | HTMLTextAreaElement | null>,
  current: () => T,
  update: (value: T) => void,
): void {
  const initial = current();
  function restoreDefault(): void {
    const element = control.value;
    if (!element) return;
    if (typeof initial === 'boolean') (element as HTMLInputElement).defaultChecked = initial;
    else element.defaultValue = initial;
  }
  onMounted(restoreDefault);
  onUpdated(restoreDefault);
  useCmFormReset(control, () => {
    if (current() !== initial) update(initial);
  });
}
