import { observeFormReset } from './form-reset.js';
import type { CmControllerFactory } from './runtime.js';

export const createCmSwitchController: CmControllerFactory = (root) => {
  const input = root.querySelector<HTMLInputElement>('.cm-switch__input[type=checkbox]');
  if (!input) throw new TypeError('Switch controller requires one native checkbox input.');
  const synchronize = () => input.setAttribute('aria-checked', String(input.checked));
  let stopReset: (() => void) | undefined;
  return {
    connect() {
      synchronize();
      input.addEventListener('change', synchronize);
      stopReset ??= observeFormReset(input, synchronize);
    },
    disconnect() {
      input.removeEventListener('change', synchronize);
      stopReset?.();
      stopReset = undefined;
    },
  };
};
