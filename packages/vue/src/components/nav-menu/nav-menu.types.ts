export type CmNavMenuVariant = 'sidebar' | 'inline';
export type CmNavMenuExpandMode = 'multiple' | 'single';

export interface CmNavMenuItem {
  value: string;
  label: string;
  kind?: 'item' | 'group';
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  children?: CmNavMenuItem[];
}

export interface CmNavMenuProps {
  items: readonly CmNavMenuItem[];
  value?: string | null;
  expandedValues?: readonly string[] | null;
  expandMode?: CmNavMenuExpandMode;
  variant?: CmNavMenuVariant;
  ariaLabel?: string;
}
