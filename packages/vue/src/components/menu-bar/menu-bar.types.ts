export type CmMenuBarVariant = 'default' | 'pills';

export interface CmMenuBarItem {
  value: string;
  label: string;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  children?: CmMenuBarItem[];
}

export interface CmMenuBarProps {
  items: readonly CmMenuBarItem[];
  openPath?: readonly string[] | null;
  modelValue?: string | null;
  defaultValue?: string | null;
  variant?: CmMenuBarVariant;
  ariaLabel?: string;
}
