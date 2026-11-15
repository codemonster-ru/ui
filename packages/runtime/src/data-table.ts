import {
  ariaSortFor,
  formatTemplate,
  nextSortState,
  sortLabelFor,
  type CmDataTableColumnWidths,
  type CmDataTableSortState,
} from './core/data-table.js';
import {
  measureDataTableColumnContent,
  measureDataTableResizeBoundary,
  observeDataTableResizeGuide,
  resizedDataTableWidths,
  type CmDataTableResizeBoundary,
} from './data-table-resize.js';
import { dispatchCmEvent } from './events.js';
import { observeDataTablePins } from './data-table-pinning.js';
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

export interface DataTableExpansionChangeDetail {
  rowId: string;
  expanded: boolean;
}

export interface DataTablePageChangeDetail {
  page: number;
}

export interface DataTablePageSizeChangeDetail {
  pageSize: number;
}

const sortSelector = '[data-cm-data-table-sort]';
const expansionSelector = 'button[data-cm-data-table-expand]';
const tableOwnerSelector = '[data-cm-controller~="data-table"]';
const rowSelector = '[data-cm-data-table-row]';
const rowInputSelector = '[data-cm-data-table-select-row]';
const selectAllSelector = '[data-cm-data-table-select-all]';
const pageSelector = '[data-cm-data-table-page-action]';
const pageSizeSelector = '[data-cm-data-table-page-size-control]';
const resizeSelector = '[data-cm-data-table-resize]';

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInteger(value: string | null): number | null {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export class CmDataTableController implements CmController {
  readonly #root: Element;
  readonly #table: HTMLTableElement;
  #stopPinning: (() => void) | undefined;
  #stopResizeGuide?: () => void;
  #drag:
    | {
        handle: HTMLElement;
        boundary: CmDataTableResizeBoundary;
        start: number;
        pointer: number;
        widths?: CmDataTableColumnWidths;
      }
    | undefined;

  constructor(root: Element) {
    const table = root.querySelector<HTMLTableElement>('.cm-data-table__table');
    if (!table) {
      throw new TypeError('DataTable controller requires a table.');
    }
    this.#root = root;
    this.#table = table;
  }

  connect(): void {
    this.#synchronizeSort();
    this.#synchronizeSelection();
    this.#synchronizePage();
    for (const button of this.#controls<HTMLButtonElement>(expansionSelector, this.#table)) {
      const disclosure = this.#expansionFor(button);
      if (disclosure) this.#setExpanded(button, disclosure.panel, !disclosure.panel.hidden);
    }
    if (this.#table.tHead?.querySelector('[data-cm-data-table-pin]')) {
      this.#stopPinning = observeDataTablePins(this.#table, (offsets) => {
        for (const cell of this.#pinnedCells()) {
          const offset = offsets[cell.dataset.cmDataTableColumn ?? ''];
          if (typeof offset === 'number') cell.style.setProperty('--cm-data-table-pin-offset', `${offset}px`);
        }
        this.#table.setAttribute('data-cm-data-table-pins-ready', '');
      });
    }
    for (const handle of this.#table.querySelectorAll<HTMLElement>(resizeSelector)) {
      if (handle.closest('table') !== this.#table) continue;
      this.#stopResizeGuide ??= observeDataTableResizeGuide(this.#table);
      const boundary = measureDataTableResizeBoundary(handle);
      if (boundary) this.#resizeAria(handle, boundary);
    }
    this.#root.addEventListener('click', this.#handleClick);
    this.#root.addEventListener('change', this.#handleChange);
    this.#root.addEventListener('focusin', this.#handleResizeFocus);
    this.#root.addEventListener('keydown', this.#handleResizeKey);
    this.#root.addEventListener('dblclick', this.#handleResizeDoubleClick);
    this.#root.addEventListener('pointerdown', this.#startResize);
    this.#root.addEventListener('pointermove', this.#moveResize);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.#root.addEventListener(type, this.#finishResize);
    }
  }

  disconnect(): void {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#root.removeEventListener('change', this.#handleChange);
    this.#root.removeEventListener('focusin', this.#handleResizeFocus);
    this.#root.removeEventListener('keydown', this.#handleResizeKey);
    this.#root.removeEventListener('dblclick', this.#handleResizeDoubleClick);
    this.#root.removeEventListener('pointerdown', this.#startResize);
    this.#root.removeEventListener('pointermove', this.#moveResize);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      this.#root.removeEventListener(type, this.#finishResize);
    }
    this.#drag?.handle.removeAttribute('data-cm-data-table-resizing');
    this.#drag = undefined;
    this.#stopResizeGuide?.();
    this.#stopResizeGuide = undefined;
    if (this.#stopPinning) {
      this.#stopPinning();
      this.#stopPinning = undefined;
      this.#table.removeAttribute('data-cm-data-table-pins-ready');
      for (const cell of this.#pinnedCells()) cell.style.removeProperty('--cm-data-table-pin-offset');
    }
  }

  #pinnedCells(): HTMLElement[] {
    return [...this.#table.querySelectorAll<HTMLElement>('[data-cm-data-table-pin]')].filter(
      (cell) => cell.closest('table') === this.#table,
    );
  }

  #resizeHandle(event: Event): HTMLElement | null {
    const handle = this.#eventElement(event)?.closest<HTMLElement>(resizeSelector);
    return handle?.closest('table') === this.#table ? handle : null;
  }

  #resizeAria(handle: HTMLElement, boundary: CmDataTableResizeBoundary, width = boundary.value): void {
    handle.setAttribute('aria-valuemin', String(boundary.minimum));
    handle.setAttribute('aria-valuemax', String(boundary.maximum));
    handle.setAttribute('aria-valuenow', String(width));
  }

  #applyResize(handle: HTMLElement, boundary: CmDataTableResizeBoundary, delta: number): CmDataTableColumnWidths {
    const widths = resizedDataTableWidths(boundary, delta);
    for (const cell of this.#table.querySelectorAll<HTMLElement>('[data-cm-data-table-column]')) {
      const width = widths[cell.dataset.cmDataTableColumn ?? ''];
      if (cell.closest('table') === this.#table && typeof width === 'string') cell.style.inlineSize = width;
    }
    this.#table.setAttribute('data-cm-data-table-fixed-columns', '');
    this.#resizeAria(handle, boundary, Number.parseFloat(widths[boundary.column]));
    dispatchCmEvent(this.#root, 'data-table-column-widths-change', { columnWidths: { ...widths } });
    return widths;
  }

  readonly #handleResizeFocus = (event: Event): void => {
    const handle = this.#resizeHandle(event);
    const boundary = handle && measureDataTableResizeBoundary(handle);
    if (handle && boundary) this.#resizeAria(handle, boundary);
  };

  readonly #handleResizeKey = (event: Event): void => {
    const KeyboardEvent_ = this.#root.ownerDocument.defaultView?.KeyboardEvent;
    if (!KeyboardEvent_ || !(event instanceof KeyboardEvent_)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const handle = this.#resizeHandle(event);
    const boundary = handle && measureDataTableResizeBoundary(handle);
    if (!handle || !boundary) return;
    event.preventDefault();
    const columnWidths = this.#applyResize(
      handle,
      boundary,
      (event.key === 'ArrowRight' ? 8 : -8) * boundary.direction,
    );
    dispatchCmEvent(this.#root, 'data-table-column-resize-end', { columnWidths });
  };

  readonly #handleResizeDoubleClick = (event: Event): void => {
    const handle = this.#resizeHandle(event);
    const boundary = handle && measureDataTableResizeBoundary(handle);
    if (!handle || !boundary) return;
    const columnWidths = this.#applyResize(handle, boundary, measureDataTableColumnContent(handle) - boundary.value);
    dispatchCmEvent(this.#root, 'data-table-column-resize-end', { columnWidths });
  };

  #pointerEvent(event: Event): PointerEvent | null {
    const PointerEvent_ = this.#root.ownerDocument.defaultView?.PointerEvent;
    return PointerEvent_ && event instanceof PointerEvent_ ? event : null;
  }

  readonly #startResize = (event: Event): void => {
    const pointer = this.#pointerEvent(event);
    if (pointer?.button !== 0 || this.#drag) return;
    const handle = this.#resizeHandle(event);
    const boundary = handle && measureDataTableResizeBoundary(handle);
    if (!handle || !boundary) return;
    this.#drag = { handle, boundary, start: pointer.clientX, pointer: pointer.pointerId };
    handle.setAttribute('data-cm-data-table-resizing', '');
    handle.setPointerCapture?.(pointer.pointerId);
  };

  readonly #moveResize = (event: Event): void => {
    const pointer = this.#pointerEvent(event);
    const drag = this.#drag;
    if (!pointer || !drag || pointer.pointerId !== drag.pointer) return;
    drag.widths = this.#applyResize(
      drag.handle,
      drag.boundary,
      (pointer.clientX - drag.start) * drag.boundary.direction,
    );
  };

  readonly #finishResize = (event: Event): void => {
    const pointer = this.#pointerEvent(event);
    if (!pointer || !this.#drag || pointer.pointerId !== this.#drag.pointer) return;
    const columnWidths = this.#drag.widths;
    this.#drag.handle.removeAttribute('data-cm-data-table-resizing');
    this.#drag = undefined;
    if (columnWidths) dispatchCmEvent(this.#root, 'data-table-column-resize-end', { columnWidths });
  };

  readonly #handleClick = (event: Event): void => {
    const target = this.#eventElement(event);
    if (!target) return;

    const expansionButton = target.closest<HTMLButtonElement>(expansionSelector);
    if (expansionButton) {
      this.#toggleExpansion(expansionButton);
      return;
    }

    const sortButton = target.closest<HTMLElement>(sortSelector);
    if (sortButton?.closest('table') === this.#table) {
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
    if (selectAll?.closest('table') === this.#table) {
      for (const input of this.#rowInputs()) {
        if (!input.disabled) input.checked = selectAll.checked;
      }
      this.#reportSelection();
      return;
    }

    const rowInput = target.closest<HTMLInputElement>(rowInputSelector);
    if (rowInput?.closest('table') === this.#table && rowInput.closest(rowSelector)) {
      this.#reportSelection();
      return;
    }

    const pageSize = target.closest<HTMLSelectElement>(pageSizeSelector);
    if (pageSize && this.#root.contains(pageSize)) this.#requestPageSize(pageSize);
  };

  #eventElement(event: Event): Element | null {
    const ElementConstructor = this.#root.ownerDocument.defaultView?.Element;
    return ElementConstructor && event.target instanceof ElementConstructor && this.#owns(event.target)
      ? event.target
      : null;
  }

  #owns(element: Element): boolean {
    const owner = element.closest(tableOwnerSelector);
    return this.#root.contains(element) && (!owner || owner === this.#root);
  }

  #controls<T extends Element>(selector: string, scope = this.#root): T[] {
    return [...scope.querySelectorAll<T>(selector)].filter(
      (control) => this.#owns(control) && (scope !== this.#table || control.closest('table') === this.#table),
    );
  }

  #expansionFor(button: HTMLButtonElement): { rowId: string; panel: HTMLElement } | null {
    if (button.closest('table') !== this.#table) return null;
    const row = button.closest<HTMLElement>(`tr${rowSelector}`);
    const rowId = row?.dataset.cmDataTableRow;
    const controls = button.getAttribute('aria-controls');
    const panel = controls ? button.ownerDocument.getElementById(controls) : null;
    if (
      !rowId ||
      !panel?.matches('tr.cm-data-table__expanded-row') ||
      panel === row ||
      row?.parentElement?.tagName !== 'TBODY' ||
      panel.parentElement !== row.parentElement
    ) {
      return null;
    }
    return { rowId, panel };
  }

  #setExpanded(button: HTMLButtonElement, panel: HTMLElement, expanded: boolean): void {
    if (!expanded && panel.contains(panel.ownerDocument.activeElement)) button.focus();
    button.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
    const label = expanded ? button.dataset.cmDataTableCollapseLabel : button.dataset.cmDataTableExpandLabel;
    if (label?.trim()) button.setAttribute('aria-label', label);
  }

  #toggleExpansion(button: HTMLButtonElement): void {
    if (button.disabled) return;
    const disclosure = this.#expansionFor(button);
    if (!disclosure) return;
    const { panel, rowId } = disclosure;
    const expanded = panel.hidden;
    this.#setExpanded(button, panel, expanded);
    dispatchCmEvent<DataTableExpansionChangeDetail>(this.#root, 'data-table-expansion-change', { rowId, expanded });
  }

  get #sortState(): CmDataTableSortState | null {
    const key = this.#root.getAttribute('data-cm-data-table-sort-key');
    const direction = this.#root.getAttribute('data-cm-data-table-sort-direction');
    if (!key || (direction !== 'ascending' && direction !== 'descending')) return null;
    return { direction, key };
  }

  #requestSort(button: HTMLElement): void {
    const key = button.dataset.cmDataTableSort;
    if (!key) return;
    const sort = nextSortState(this.#sortState, key);

    this.#root.setAttribute('data-cm-data-table-sort-key', sort?.key ?? '');
    this.#root.setAttribute('data-cm-data-table-sort-direction', sort?.direction ?? '');
    this.#synchronizeSort();
    dispatchCmEvent<DataTableSortChangeDetail>(this.#root, 'data-table-sort-change', { sort });
  }

  #synchronizeSort(): void {
    const sort = this.#sortState;
    for (const button of this.#controls<HTMLElement>(sortSelector, this.#table)) {
      const key = button.dataset.cmDataTableSort ?? '';
      button.closest('th')?.setAttribute('aria-sort', ariaSortFor(sort, key));
      const template = {
        ascending: button.dataset.cmDataTableSortAscendingLabelTemplate ?? 'Sort {column} ascending',
        clear: button.dataset.cmDataTableClearSortLabelTemplate ?? 'Clear sorting for {column}',
        descending: button.dataset.cmDataTableSortDescendingLabelTemplate ?? 'Sort {column} descending',
      }[sortLabelFor(sort, key)];
      button.setAttribute('aria-label', formatTemplate(template, { column: this.#sortLabel(button) }));
    }
  }

  #sortLabel(button: HTMLElement): string {
    const indicator = button.querySelector('.cm-data-table__sort-indicator');
    const indicatorText = indicator?.textContent ?? '';
    const completeText = button.textContent ?? '';
    return completeText.replace(indicatorText, '').trim();
  }

  #rowInputs(): HTMLInputElement[] {
    return this.#controls<HTMLInputElement>(rowInputSelector, this.#table).filter((input) =>
      input.closest(rowSelector),
    );
  }

  #synchronizeSelection(): void {
    const inputs = this.#rowInputs();
    const enabled = inputs.filter((input) => !input.disabled);
    const selected = enabled.filter((input) => input.checked);
    const [selectAll] = this.#controls<HTMLInputElement>(selectAllSelector, this.#table);
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
    for (const button of this.#controls<HTMLButtonElement>(pageSelector)) {
      const action = button.dataset.cmDataTablePageAction;
      button.disabled = action === 'previous' ? page <= 1 : action === 'next' ? page >= pageCount : true;
    }
    const [pageSummary] = this.#controls<HTMLElement>('.cm-data-table__page-summary');
    if (pageSummary) {
      const template = pageSummary.dataset.cmDataTablePageSummaryTemplate ?? 'Page {page} of {pageCount}';
      pageSummary.textContent = formatTemplate(template, { page, pageCount });
    }
    const [paginationSummary] = this.#controls<HTMLElement>('.cm-data-table__pagination-summary');
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
