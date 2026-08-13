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
  selectable?: boolean;
  selectedRowIds?: readonly string[];
  sort?: CmDataTableSort | null;
  page?: number;
  pageCount?: number;
  loading?: boolean;
  error?: boolean;
  emptyText?: string;
  loadingText?: string;
  errorText?: string;
  paginationLabel?: string;
  previousPageLabel?: string;
  nextPageLabel?: string;
  selectAllLabel?: string;
}
