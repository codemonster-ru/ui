import type { CmLinkProps } from '../link/link.types';

export type CmNavMenuVariant = 'sidebar' | 'inline' | 'pills';
export type CmNavMenuExpandMode = 'multiple' | 'single';

export interface CmNavMenuItem {
  value: string;
  label: string;
  kind?: 'item' | 'group';
  href?: string;
  to?: CmLinkProps['to'];
  target?: string;
  rel?: string;
  disabled?: boolean;
  children?: CmNavMenuItem[];
}

export interface CmNavMenuProps {
  items: readonly CmNavMenuItem[];
  value?: string | null;
  modelValue?: string | null;
  defaultValue?: string | null;
  linkComponent?: CmLinkProps['component'];
  expandedValues?: readonly string[] | null;
  expandMode?: CmNavMenuExpandMode;
  variant?: CmNavMenuVariant;
  ariaLabel?: string;
}
