import type { CmMenuItem } from '../menu/menu.types';

export type CmDropdownPlacement = 'bottom-start' | 'bottom-end';

export interface CmDropdownProps {
  id: string;
  label: string;
  items: readonly CmMenuItem[];
  open?: boolean;
  disabled?: boolean;
  placement?: CmDropdownPlacement;
}
