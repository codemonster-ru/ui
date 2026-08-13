import type { CmController, CmControllerFactory } from './runtime.js';

export class CmCheckboxController implements CmController {
  readonly #input: HTMLInputElement;

  constructor(root: Element) {
    const input = root.querySelector<HTMLInputElement>('.cm-checkbox__input[type="checkbox"]');
    if (!input) throw new TypeError('Checkbox controller requires one native checkbox input.');
    this.#input = input;
  }

  connect(): void {
    this.#input.indeterminate = true;
  }

  disconnect(): void {
    this.#input.indeterminate = false;
  }
}

export const createCmCheckboxController: CmControllerFactory = (element) => new CmCheckboxController(element);
