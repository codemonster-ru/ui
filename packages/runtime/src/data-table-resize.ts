import type { CmDataTableColumnWidths } from './core/data-table.js';

interface ColumnMeasure {
  key: string;
  width: number;
  minimum: number;
  maximum: number;
}

export interface CmDataTableResizeBoundary {
  column: string;
  minimum: number;
  maximum: number;
  value: number;
  direction: 1 | -1;
  adjacent: ColumnMeasure;
  widths: CmDataTableColumnWidths;
}

const columnSelector = '[data-cm-data-table-column]';
const resizerSelector = '[data-cm-data-table-resize]';

export function observeDataTableResizeGuide(table: HTMLTableElement): () => void {
  const head = table.tHead;
  if (!head) return () => {};
  const property = '--cm-data-table-resize-guide-height';
  const measure = () => {
    const body = table.tBodies[table.tBodies.length - 1];
    const height = (body ?? head).getBoundingClientRect().bottom - head.getBoundingClientRect().top;
    table.style.setProperty(property, `${Math.max(0, height)}px`);
  };
  const Observer = table.ownerDocument.defaultView?.ResizeObserver;
  const observer = Observer && new Observer(measure);
  observer?.observe(table);
  observer?.observe(head);
  measure();
  return () => {
    observer?.disconnect();
    table.style.removeProperty(property);
  };
}

function pixelSize(value: string, tableWidth: number, fallback: number): number {
  if (value.endsWith('px')) return Number.parseFloat(value);
  if (value.endsWith('%')) return (Number.parseFloat(value) / 100) * tableWidth;
  return fallback;
}

export function measureDataTableResizeBoundary(handle: Element): CmDataTableResizeBoundary | null {
  const header = handle.closest<HTMLTableCellElement>(`th${columnSelector}`);
  const headerRow = header?.parentElement;
  const adjacentHeader = header?.nextElementSibling;
  const table = header?.closest('table');
  const view = table?.ownerDocument.defaultView;
  if (!header || !headerRow || !adjacentHeader?.matches(columnSelector) || !table || !view) return null;

  const tableWidth = table.getBoundingClientRect().width;
  const measure = (cell: Element): ColumnMeasure => {
    const style = view.getComputedStyle(cell);
    const minimum = Math.max(0, pixelSize(style.minInlineSize || style.minWidth, tableWidth, 0));
    return {
      key: cell.getAttribute('data-cm-data-table-column') ?? '',
      width: cell.getBoundingClientRect().width,
      minimum,
      maximum: Math.max(minimum, pixelSize(style.maxInlineSize || style.maxWidth, tableWidth, Infinity)),
    };
  };
  const first = measure(header);
  const adjacent = measure(adjacentHeader);
  if (!first.key || !adjacent.key || first.width <= 0 || adjacent.width <= 0) return null;

  // Keep zero in the interval when the automatic table layout already lies outside a constraint.
  const lower = Math.max(Math.min(0, first.minimum - first.width), Math.min(0, adjacent.width - adjacent.maximum));
  const upper = Math.min(Math.max(0, first.maximum - first.width), Math.max(0, adjacent.width - adjacent.minimum));
  const widths = Object.fromEntries(
    [...headerRow.children].flatMap((cell): [string, string][] => {
      const key = cell.getAttribute('data-cm-data-table-column');
      return key ? [[key, `${Math.round(cell.getBoundingClientRect().width)}px`]] : [];
    }),
  );
  return {
    column: first.key,
    minimum: Math.round(first.width + lower),
    maximum: Math.round(first.width + upper),
    value: Math.round(first.width),
    direction: view.getComputedStyle(table).direction === 'rtl' ? -1 : 1,
    adjacent,
    widths,
  };
}

export function resizedDataTableWidths(boundary: CmDataTableResizeBoundary, delta: number): CmDataTableColumnWidths {
  const value = Math.min(boundary.maximum, Math.max(boundary.minimum, Math.round(boundary.value + delta)));
  return {
    ...boundary.widths,
    [boundary.column]: `${value}px`,
    [boundary.adjacent.key]: `${boundary.value + Math.round(boundary.adjacent.width) - value}px`,
  };
}

export function measureDataTableColumnContent(handle: Element): number {
  const header = handle.closest<HTMLTableCellElement>(`th${columnSelector}`);
  const table = header?.closest('table');
  if (!header || !table) return 0;

  const document = table.ownerDocument;
  const sample = document.createElement('table');
  const body = sample.createTBody();
  const key = header.getAttribute('data-cm-data-table-column');
  sample.className = table.className;
  sample.setAttribute('aria-hidden', 'true');
  Object.assign(sample.style, {
    position: 'fixed',
    insetBlockStart: '-10000px',
    insetInlineStart: '-10000px',
    inlineSize: 'max-content',
    minInlineSize: '0',
    visibility: 'hidden',
  });
  for (const cell of table.querySelectorAll<HTMLTableCellElement>(columnSelector)) {
    if (cell.closest('table') !== table || cell.getAttribute('data-cm-data-table-column') !== key) continue;
    const clone = cell.cloneNode(true) as HTMLTableCellElement;
    clone.querySelector(resizerSelector)?.remove();
    clone.removeAttribute('data-cm-data-table-column');
    Object.assign(clone.style, {
      inlineSize: 'auto',
      minInlineSize: '0',
      maxInlineSize: 'none',
      whiteSpace: 'nowrap',
    });
    body.insertRow().append(clone);
  }
  table.parentElement?.append(sample);
  try {
    return Math.max(sample.getBoundingClientRect().width, sample.scrollWidth);
  } finally {
    sample.remove();
  }
}
