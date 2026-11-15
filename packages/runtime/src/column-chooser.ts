import { resolveColumnChooserState, resolveVisibleColumns, toggleAllColumns } from './core/data-table.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface ColumnChooserVisibleColumnsChangeDetail {
  visibleColumnKeys: string[];
}

interface ColumnControl {
  input: HTMLInputElement;
  key: string;
  required: boolean;
}

const chooserSelector = '.cm-column-chooser';
const optionSelector = 'input[type="checkbox"][data-cm-column-chooser-key]';
const allSelector = 'input[type="checkbox"][data-cm-column-chooser-all]';

export class CmColumnChooserController implements CmController {
  readonly #root: Element;
  readonly #trigger: HTMLButtonElement;
  readonly #all: HTMLInputElement;

  constructor(root: Element) {
    const trigger = root.querySelector<HTMLButtonElement>('.cm-column-chooser__trigger');
    const all = root.querySelector<HTMLInputElement>(allSelector);
    if (!trigger || !all) throw new TypeError('ColumnChooser requires a trigger and an all-columns checkbox.');
    this.#root = root;
    this.#trigger = trigger;
    this.#all = all;
  }

  connect(): void {
    this.#synchronize(this.#columns());
    this.#root.addEventListener('change', this.#handleChange);
  }

  disconnect(): void {
    this.#root.removeEventListener('change', this.#handleChange);
  }

  #columns(): ColumnControl[] {
    const inputs = this.#root.querySelectorAll<HTMLInputElement>(optionSelector);
    return [...inputs].flatMap((input) => {
      const key = input.dataset.cmColumnChooserKey;
      if (!key || input.closest(chooserSelector) !== this.#root) return [];
      return [{ input, key, required: input.hasAttribute('data-cm-column-chooser-required') }];
    });
  }

  readonly #handleChange = (event: Event): void => {
    if (this.#trigger.matches(':disabled')) return;

    const columns = this.#columns();
    const all = event.target === this.#all;
    const selectedColumn = columns.find(({ input }) => input === event.target);
    if (all ? this.#all.matches(':disabled') : !selectedColumn || selectedColumn.input.matches(':disabled')) {
      return;
    }

    const visibleColumnKeys = this.#synchronize(columns, all ? this.#all.checked : undefined);
    dispatchCmEvent<ColumnChooserVisibleColumnsChangeDetail>(this.#root, 'column-chooser-visible-columns-change', {
      visibleColumnKeys,
    });
  };

  #synchronize(columns: ColumnControl[], allChecked?: boolean): string[] {
    const keys = columns.map(({ key }) => key);
    const required = columns.filter((column) => column.required).map(({ key }) => key);
    const optional = columns.filter((column) => !column.required).map(({ key }) => key);
    const requested = columns.filter(({ input }) => input.checked).map(({ key }) => key);
    const visible =
      allChecked === undefined
        ? resolveVisibleColumns(keys, requested, required)
        : toggleAllColumns(keys, allChecked, required);

    const state = resolveColumnChooserState(optional, visible);
    this.#all.checked = state.all;
    this.#all.indeterminate = state.partial;
    this.#all.disabled = this.#trigger.disabled || optional.length === 0;
    for (const { input, key, required: locked } of columns) {
      input.checked = visible.includes(key);
      input.disabled = this.#trigger.disabled || locked;
    }
    return visible;
  }
}

export const createCmColumnChooserController: CmControllerFactory = (element) => new CmColumnChooserController(element);
