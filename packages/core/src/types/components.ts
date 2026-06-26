import type { IconName } from '@codemonster-ru/vueforge-icons';

export type VfButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast'
  | 'ghost';
export type VfControlSize = 'sm' | 'md' | 'lg';
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
export type VfDataTableCellAlign = 'start' | 'center' | 'end';

export type VfDataTableRow = object;

export interface VfDataTableColumn {
  key: string;
  header?: string;
  align?: VfDataTableCellAlign;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
}

export interface VfSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
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

export interface VfTableOfContentsItem {
  id: string;
  label: string;
  level?: number;
  href?: string;
}
