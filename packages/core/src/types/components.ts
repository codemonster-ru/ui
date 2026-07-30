import type { IconName } from '@codemonster-ru/vueforge-icons';

export type VfButtonVariant =
  'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | 'ghost';
export type VfControlSize = 'sm' | 'md' | 'lg';
export type VfAvatarShape = 'square' | 'circle';
export type VfSwitchThumbContrast = 'auto' | 'inverse';
export type VfLinkTone = 'default' | 'muted';
export type VfLinkUnderline = 'none' | 'hover' | 'always';
export type VfBadgeTone = 'neutral' | 'primary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
export type VfFeedbackTone = 'neutral' | 'primary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';
export type VfDividerOrientation = 'horizontal' | 'vertical';
export type VfStepperOrientation = 'horizontal' | 'vertical';
export type VfStepperContentPosition = 'above' | 'below' | 'start' | 'end';
export type VfDialogSize = 'sm' | 'md' | 'lg';
export type VfDrawerSize = VfDialogSize | 'full';
export type VfDrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type VfDropdownPlacement = 'bottom-start' | 'bottom-end';
export type VfTooltipPlacement = 'top' | 'bottom';
export type VfDataTableDensity = 'default' | 'compact';
export type VfDataTableLoadingVariant = 'mask' | 'skeleton';
export type VfDataTablePaginationMode = 'client' | 'manual';
export type VfDataTableSortingMode = 'client' | 'manual';
export type VfDataTableSortDirection = 'asc' | 'desc';
export type VfDataTableColumnPin = 'start' | 'end';
export type VfDataTableCellAlign = 'start' | 'center' | 'end';
export type VfDataTableCellVerticalAlign = 'top' | 'middle' | 'bottom' | 'baseline';
export type VfDataTableColumnWidths = Record<string, string>;
export type VfDataTableColumnOrder = string[];

export type VfDataTableRow = object;
export type VfDataTableRowKey = string | number;

export interface VfDataTableSort {
  key: string;
  direction: VfDataTableSortDirection;
}

export interface VfDataTableLabels {
  empty: string;
  error: string;
  loading: string;
  pagination: string;
  paginationSummary: (firstRow: number, lastRow: number, totalRows: number) => string;
  rows: string;
  rowsPerPage: string;
  pageSummary: (page: number, pageCount: number) => string;
  goToPage: (page: number) => string;
  previousPage: string;
  nextPage: string;
  selectAllRows: string;
  selectRow: (rowIndex: number) => string;
  expandRow: (rowIndex: number) => string;
  collapseRow: (rowIndex: number) => string;
  sortAscending: (column: string) => string;
  sortDescending: (column: string) => string;
  clearSort: (column: string) => string;
  reorderColumn: (column: string, position: number, columnCount: number) => string;
  reorderColumnInstructions: string;
  columnMoved: (column: string, position: number, columnCount: number) => string;
  resizeColumn: (column: string) => string;
}

export interface VfDataTableColumn {
  key: string;
  header?: string;
  /** Enables sorting by this column. */
  sortable?: boolean;
  /** CSS width applied to the column header and cells. */
  width?: string;
  /** Minimum CSS width applied to the column header and cells. */
  minWidth?: string;
  /** Maximum CSS width applied to the column header and cells. */
  maxWidth?: string;
  /** Prevents cell content from wrapping. */
  nowrap?: boolean;
  /** Set to false to disable resizing for this column. */
  resizable?: boolean;
  /** Set to false to disable pointer and keyboard reordering for this column. */
  reorderable?: boolean;
  /** Pins the column to the logical start or end while scrolling horizontally. */
  pinned?: VfDataTableColumnPin;
  align?: VfDataTableCellAlign;
  verticalAlign?: VfDataTableCellVerticalAlign;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

export interface VfSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface VfDatePickerLabels {
  calendar: string;
  clear: string;
  previousMonth: string;
  nextMonth: string;
  previousYear?: string;
  nextYear?: string;
  time: string;
  hour: string;
  minute: string;
}

export interface VfBreadcrumbItem {
  label: string;
  href?: string;
  to?: string | Record<string, unknown>;
  target?: string;
  rel?: string;
  disabled?: boolean;
  current?: boolean;
}

export interface VfTabItem {
  value: string;
  label: string;
  disabled?: boolean;
  /** Stable DOM id for the tab trigger when it controls an external panel. */
  tabId?: string;
  /** DOM id of an external panel controlled by this tab. */
  panelId?: string;
}

export interface VfStepperItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface VfNavMenuItem {
  value: string;
  label: string;
  kind?: 'item' | 'group';
  leadingIcon?: IconName | string;
  href?: string;
  to?: string | Record<string, unknown>;
  target?: string;
  rel?: string;
  disabled?: boolean;
  children?: VfNavMenuItem[];
}

export interface VfNavMenuProps {
  items: VfNavMenuItem[];
  modelValue?: string;
  defaultValue?: string;
  ariaLabel?: string;
  expandMode?: 'multiple' | 'single';
  variant?: 'default' | 'pills' | 'sidebar';
  compact?: boolean;
}

export interface VfTableOfContentsItem {
  id: string;
  label: string;
  level?: number;
  href?: string;
}
