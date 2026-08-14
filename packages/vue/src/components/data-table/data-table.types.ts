export type CmDataTableAlign = 'start' | 'center' | 'end';
export type CmDataTableDensity = 'default' | 'compact';
export type CmDataTableSortDirection = 'ascending' | 'descending';
export type CmDataTableCellValue = string | number | null;

export interface CmDataTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  align?: CmDataTableAlign;
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

export interface CmDataTableProps {
  id: string;
  columns: readonly CmDataTableColumn[];
  rows?: readonly CmDataTableRow[];
  caption?: string;
  density?: CmDataTableDensity;
  striped?: boolean;
  columnDividers?: boolean;
  stickyHeader?: boolean;
  visibleColumnKeys?: readonly string[] | null;
  selectable?: boolean;
  selectedRowIds?: readonly string[];
  sort?: CmDataTableSort | null;
  page?: number;
  pageCount?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  totalRows?: number | null;
  loading?: boolean;
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
}
