import type {
  CmDataTableAlign,
  CmDataTableColumn,
  CmDataTableColumnPin,
  CmDataTableDensity,
  CmDataTableMode,
  CmDataTableProps,
  CmDataTableVerticalAlign,
} from './data-table.types';

export type VfDataTableRow = object;
export type VfDataTableRowKey = string | number;
export type VfDataTableCellAlign = CmDataTableAlign;
export type VfDataTableCellVerticalAlign = CmDataTableVerticalAlign;
export type VfDataTableDensity = CmDataTableDensity;
export type VfDataTableColumnPin = CmDataTableColumnPin;
export type VfDataTableColumnOrder = string[];
export type VfDataTableColumnWidths = Record<string, string>;
export type VfDataTablePaginationMode = CmDataTableMode;
export type VfDataTableSortingMode = CmDataTableMode;
export type VfDataTableLoadingVariant = 'mask' | 'skeleton';
export type VfDataTableSortDirection = 'asc' | 'desc';

export interface VfDataTableSort {
  key: string;
  direction: VfDataTableSortDirection;
}

export interface VfDataTableColumn extends Omit<CmDataTableColumn, 'header'> {
  header?: string;
}

export interface VfDataTableLabels {
  empty: string;
  error: string;
  loading: string;
  pagination: string;
  rows: string;
  rowsPerPage: string;
  previousPage: string;
  nextPage: string;
  selectAllRows: string;
}

export interface VfDataTableProps<Row extends VfDataTableRow = VfDataTableRow> extends Omit<
  CmDataTableProps<Row>,
  | 'id'
  | 'columns'
  | 'rowKey'
  | 'sort'
  | 'sortList'
  | 'selectedRowIds'
  | 'expandedRowKeys'
  | 'defaultExpandedRowKeys'
  | 'loadingVariant'
> {
  id?: string;
  columns: readonly VfDataTableColumn[];
  rowKey?: string | ((row: Row, sourceIndex: number) => VfDataTableRowKey);
  selectedRowKeys?: readonly VfDataTableRowKey[];
  defaultSelectedRowKeys?: readonly VfDataTableRowKey[];
  expandedRowKeys?: readonly VfDataTableRowKey[];
  defaultExpandedRowKeys?: readonly VfDataTableRowKey[];
  defaultPage?: number;
  defaultPageSize?: number;
  defaultColumnOrder?: readonly string[];
  sort?: readonly VfDataTableSort[];
  defaultSort?: readonly VfDataTableSort[];
  labels?: Partial<VfDataTableLabels>;
  loadingVariant?: VfDataTableLoadingVariant;
}
