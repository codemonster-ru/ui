export type CmMenuItemTone = 'default' | 'danger';

export interface CmMenuItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  active?: boolean;
  tone?: CmMenuItemTone;
}

export interface CmMenuProps {
  items: readonly CmMenuItem[];
  ariaLabel?: string;
}
