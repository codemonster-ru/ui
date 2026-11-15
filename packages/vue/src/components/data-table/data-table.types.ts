export type CmDataTableAlign = 'start' | 'center' | 'end';
export type CmDataTableVerticalAlign = 'top' | 'middle' | 'bottom' | 'baseline';
export type CmDataTableDensity = 'default' | 'compact';
export type CmDataTableSortDirection = 'ascending' | 'descending';
export type CmDataTableMode = 'client' | 'manual';
export type CmDataTableCellValue = string | number | null;
export type CmDataTableColumnPin = 'start' | 'end';
export type CmDataTableRowKeyResolver<Row extends object = CmDataTableRow> =
  string | ((row: Row, sourceIndex: number) => string | number);
export type { CmDataTableColumnWidths } from '@codemonster-ru/ui-runtime/core';

export interface CmDataTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  align?: CmDataTableAlign;
  verticalAlign?: CmDataTableVerticalAlign;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  nowrap?: boolean;
  resizable?: boolean;
  pinned?: CmDataTableColumnPin;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

export interface CmDataTableRow {
  id: string;
  cells: Readonly<Record<string, CmDataTableCellValue>>;
  selectable?: boolean;
}

export interface CmDataTableSort {
  key: string;
  direction: CmDataTableSortDirection;
}

export interface CmDataTableProps<Row extends object = CmDataTableRow> {
  id: string;
  columns: readonly CmDataTableColumn[];
  rows?: readonly Row[];
  rowKey?: CmDataTableRowKeyResolver<Row>;
  caption?: string;
  density?: CmDataTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
  visibleColumnKeys?: readonly string[] | null;
  columnOrder?: readonly string[] | null;
  columnWidths?: Readonly<Record<string, string>>;
  defaultColumnWidths?: Readonly<Record<string, string>>;
  resizableColumns?: boolean;
  resizeColumnLabelTemplate?: string;
  selectable?: boolean;
  rowSelectable?: (row: Row, rowIndex: number) => boolean;
  selectedRowIds?: readonly string[];
  controlledSelection?: boolean;
  rowLabelResolver?: (rowIndex: number) => string;
  expandedRowKeys?: readonly string[] | null;
  defaultExpandedRowKeys?: readonly string[];
  expandRowLabelTemplate?: string;
  collapseRowLabelTemplate?: string;
  sort?: CmDataTableSort | null;
  sortList?: readonly CmDataTableSort[];
  multiSort?: boolean;
  sortingMode?: CmDataTableMode;
  pagination?: boolean;
  paginationMode?: CmDataTableMode;
  page?: number;
  pageCount?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  totalRows?: number | null;
  loading?: boolean;
  loadingVariant?: 'status' | 'mask' | 'skeleton';
  loadingRows?: number;
  error?: boolean;
  emptyText?: string;
  loadingText?: string;
  errorText?: string;
  paginationLabel?: string;
  rowsPerPageLabel?: string;
  pageSummaryTemplate?: string;
  paginationSummaryTemplate?: string;
  emptyPaginationSummaryText?: string;
  previousPageText?: string;
  nextPageText?: string;
  previousPageLabel?: string;
  nextPageLabel?: string;
  selectAllLabel?: string;
  selectRowLabelTemplate?: string;
  sortAscendingLabelTemplate?: string;
  sortDescendingLabelTemplate?: string;
  clearSortLabelTemplate?: string;
}
