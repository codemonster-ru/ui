/** Run once after an associated form completes its native reset. */
export function observeFormReset(
  control: HTMLInputElement | HTMLButtonElement,
  reset: () => void,
  resolveForm: () => HTMLFormElement | null = () => control.form,
): () => void {
  const view = control.ownerDocument.defaultView;
  if (!view) return () => {};
  const root = control.getRootNode();
  const eventRoot = root instanceof view.ShadowRoot ? root : control.ownerDocument;
  const pending = new Set<number>();

  const schedule = (event: Event): void => {
    const form = resolveForm();
    if (!form || event.target !== form) return;
    // The reset event is dispatched before the native defaults are restored.
    const timer = view.setTimeout(() => {
      pending.delete(timer);
      if (!event.defaultPrevented && control.isConnected && resolveForm() === form) reset();
    });
    pending.add(timer);
  };

  eventRoot.addEventListener('reset', schedule, true);
  return () => {
    eventRoot.removeEventListener('reset', schedule, true);
    for (const timer of pending) view.clearTimeout(timer);
    pending.clear();
  };
}
