import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  direction: DataTableSortDirection;
  key: string;
}

export interface DataTableSortChangeDetail {
  sort: DataTableSort | null;
}

export interface DataTableSelectionChangeDetail {
  selectedRowIds: string[];
}

export interface DataTablePageChangeDetail {
  page: number;
}

export interface DataTablePageSizeChangeDetail {
  pageSize: number;
}

const sortSelector = '[data-cm-data-table-sort]';
const rowSelector = '[data-cm-data-table-row]';
const rowInputSelector = '[data-cm-data-table-select-row]';
const selectAllSelector = '[data-cm-data-table-select-all]';
const pageSelector = '[data-cm-data-table-page-action]';
const pageSizeSelector = '[data-cm-data-table-page-size-control]';

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInteger(value: string | null): number | null {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function formatTemplate(template: string, values: Readonly<Record<string, number | string>>): string {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.split(`{${name}}`).join(String(value)),
    template,
  );
}

export class CmDataTableController implements CmController {
  readonly #root: Element;

  constructor(root: Element) {
    if (!root.querySelector('.cm-data-table__table')) {
      throw new TypeError('DataTable controller requires a table.');
    }
    this.#root = root;
  }

  connect(): void {
    this.#synchronizeSort();
    this.#synchronizeSelection();
    this.#synchronizePage();
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('change', this.#handleChange);
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('change', this.#handleChange);
  }

  readonly #handleClick = (event: Event): void => {
    const target = this.#eventElement(event);
    if (!target) return;

    const sortButton = target.closest<HTMLElement>(sortSelector);
    if (sortButton && this.#root.contains(sortButton)) {
      this.#requestSort(sortButton);
      return;
    }

    const pageButton = target.closest<HTMLButtonElement>(pageSelector);
    if (pageButton && this.#root.contains(pageButton) && !pageButton.disabled) {
      this.#requestPage(pageButton.dataset.cmDataTablePageAction);
    }
  };

  readonly #handleChange = (event: Event): void => {
    const target = this.#eventElement(event);
    if (!target) return;

    const selectAll = target.closest<HTMLInputElement>(selectAllSelector);
    if (selectAll && this.#root.contains(selectAll)) {
      for (const input of this.#rowInputs()) {
        if (!input.disabled) input.checked = selectAll.checked;
      }
      this.#reportSelection();
      return;
    }

    const rowInput = target.closest<HTMLInputElement>(rowInputSelector);
    if (rowInput && this.#root.contains(rowInput)) {
      this.#reportSelection();
      return;
    }

    const pageSize = target.closest<HTMLSelectElement>(pageSizeSelector);
    if (pageSize && this.#root.contains(pageSize)) this.#requestPageSize(pageSize);
  };

  #eventElement(event: Event): Element | null {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    return ElementConstructor && event.target instanceof ElementConstructor ? event.target : null;
  }

  #requestSort(button: HTMLElement): void {
    const key = button.dataset.cmDataTableSort;
    if (!key) return;
    const currentKey = this.#root.getAttribute('data-cm-data-table-sort-key');
    const currentDirection = this.#root.getAttribute('data-cm-data-table-sort-direction');
    const direction =
      currentKey !== key || currentDirection === ''
        ? 'ascending'
        : currentDirection === 'ascending'
          ? 'descending'
          : null;

    this.#root.setAttribute('data-cm-data-table-sort-key', direction ? key : '');
    this.#root.setAttribute('data-cm-data-table-sort-direction', direction ?? '');
    this.#synchronizeSort();
    dispatchCmEvent<DataTableSortChangeDetail>(this.#root, 'data-table-sort-change', {
      sort: direction ? { direction, key } : null,
    });
  }

  #synchronizeSort(): void {
    const key = this.#root.getAttribute('data-cm-data-table-sort-key');
    const direction = this.#root.getAttribute('data-cm-data-table-sort-direction');
    for (const button of this.#root.querySelectorAll<HTMLElement>(sortSelector)) {
      const active = button.dataset.cmDataTableSort === key;
      const resolved = active && (direction === 'ascending' || direction === 'descending') ? direction : 'none';
      button.closest('th')?.setAttribute('aria-sort', resolved);
      const label = this.#sortLabel(button);
      const template =
        resolved === 'none'
          ? (button.dataset.cmDataTableSortAscendingLabelTemplate ?? 'Sort {column} ascending')
          : resolved === 'ascending'
            ? (button.dataset.cmDataTableSortDescendingLabelTemplate ?? 'Sort {column} descending')
            : (button.dataset.cmDataTableClearSortLabelTemplate ?? 'Clear sorting for {column}');
      button.setAttribute('aria-label', formatTemplate(template, { column: label }));
    }
  }

  #sortLabel(button: HTMLElement): string {
    const indicator = button.querySelector('.cm-data-table__sort-indicator');
    const indicatorText = indicator?.textContent ?? '';
    const completeText = button.textContent ?? '';
    return completeText.replace(indicatorText, '').trim();
  }

  #rowInputs(): HTMLInputElement[] {
    return [...this.#root.querySelectorAll<HTMLInputElement>(rowInputSelector)];
  }

  #synchronizeSelection(): void {
    const inputs = this.#rowInputs();
    const enabled = inputs.filter((input) => !input.disabled);
    const selected = enabled.filter((input) => input.checked);
    const selectAll = this.#root.querySelector<HTMLInputElement>(selectAllSelector);
    if (selectAll) {
      selectAll.checked = enabled.length > 0 && selected.length === enabled.length;
      selectAll.indeterminate = selected.length > 0 && selected.length < enabled.length;
      selectAll.disabled = enabled.length === 0;
    }
    for (const input of inputs) {
      input.closest<HTMLElement>(rowSelector)?.classList.toggle('cm-data-table__row--selected', input.checked);
    }
    this.#root.setAttribute(
      'data-cm-data-table-selected-count',
      String(inputs.filter((input) => input.checked).length),
    );
  }

  #reportSelection(): void {
    this.#synchronizeSelection();
    dispatchCmEvent<DataTableSelectionChangeDetail>(this.#root, 'data-table-selection-change', {
      selectedRowIds: this.#rowInputs()
        .filter((input) => input.checked)
        .map((input) => input.value),
    });
  }

  #requestPage(action: string | undefined): void {
    const pageCount = positiveInteger(this.#root.getAttribute('data-cm-data-table-page-count'), 1);
    const current = positiveInteger(this.#root.getAttribute('data-cm-data-table-page'), 1);
    const page =
      action === 'previous' ? Math.max(1, current - 1) : action === 'next' ? Math.min(pageCount, current + 1) : current;
    if (page === current) return;
    this.#root.setAttribute('data-cm-data-table-page', String(page));
    this.#synchronizePage();
    dispatchCmEvent<DataTablePageChangeDetail>(this.#root, 'data-table-page-change', { page });
  }

  #requestPageSize(control: HTMLSelectElement): void {
    const pageSize = positiveInteger(control.value, 0);
    const current = positiveInteger(this.#root.getAttribute('data-cm-data-table-page-size'), 0);
    if (pageSize === 0 || pageSize === current) return;
    const page = positiveInteger(this.#root.getAttribute('data-cm-data-table-page'), 1);
    this.#root.setAttribute('data-cm-data-table-page-size', String(pageSize));
    if (page !== 1) this.#root.setAttribute('data-cm-data-table-page', '1');
    this.#synchronizePage();
    dispatchCmEvent<DataTablePageSizeChangeDetail>(this.#root, 'data-table-page-size-change', { pageSize });

    if (page !== 1) {
      dispatchCmEvent<DataTablePageChangeDetail>(this.#root, 'data-table-page-change', { page: 1 });
    }
  }

  #synchronizePage(): void {
    const totalRows = nonNegativeInteger(this.#root.getAttribute('data-cm-data-table-total-rows'));
    const pageSize = positiveInteger(this.#root.getAttribute('data-cm-data-table-page-size'), 1);
    const pageCount =
      totalRows === null
        ? positiveInteger(this.#root.getAttribute('data-cm-data-table-page-count'), 1)
        : Math.max(1, Math.ceil(totalRows / pageSize));
    this.#root.setAttribute('data-cm-data-table-page-count', String(pageCount));
    const page = Math.min(positiveInteger(this.#root.getAttribute('data-cm-data-table-page'), 1), pageCount);
    this.#root.setAttribute('data-cm-data-table-page', String(page));
    for (const button of this.#root.querySelectorAll<HTMLButtonElement>(pageSelector)) {
      const action = button.dataset.cmDataTablePageAction;
      button.disabled = action === 'previous' ? page <= 1 : action === 'next' ? page >= pageCount : true;
    }
    const pageSummary = this.#root.querySelector<HTMLElement>('.cm-data-table__page-summary');
    if (pageSummary) {
      const template = pageSummary.dataset.cmDataTablePageSummaryTemplate ?? 'Page {page} of {pageCount}';
      pageSummary.textContent = formatTemplate(template, { page, pageCount });
    }
    const paginationSummary = this.#root.querySelector<HTMLElement>('.cm-data-table__pagination-summary');
    if (paginationSummary && totalRows !== null) {
      if (totalRows === 0) {
        paginationSummary.textContent = paginationSummary.dataset.cmDataTableEmptyPaginationSummary ?? '0 rows';
      } else {
        const template =
          paginationSummary.dataset.cmDataTablePaginationSummaryTemplate ?? '{firstRow}-{lastRow} of {totalRows}';
        paginationSummary.textContent = formatTemplate(template, {
          firstRow: (page - 1) * pageSize + 1,
          lastRow: Math.min(page * pageSize, totalRows),
          totalRows,
        });
      }
    }
  }
}

export const createCmDataTableController: CmControllerFactory = (element) => new CmDataTableController(element);
