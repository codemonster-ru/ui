import type { CmControllerFactory } from './runtime.js';

export const createCmSwitchController: CmControllerFactory = (root) => {
  const input = root.querySelector<HTMLInputElement>('.cm-switch__input[type=checkbox]');
  if (!input) throw new TypeError('Switch controller requires one native checkbox input.');
  const synchronize = () => input.setAttribute('aria-checked', String(input.checked));
  const reset = () =>
    queueMicrotask(() => {
      if (connected) synchronize();
    });
  let connected = false;
  let form: HTMLFormElement | null = null;
  return {
    connect() {
      connected = true;
      form = input.form;
      synchronize();
      input.addEventListener('change', synchronize);
      form?.addEventListener('reset', reset);
    },
    disconnect() {
      connected = false;
      input.removeEventListener('change', synchronize);
      form?.removeEventListener('reset', reset);
      form = null;
    },
  };
};
