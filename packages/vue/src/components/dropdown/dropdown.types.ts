import type { CmMenuItem } from '../menu/menu.types';

export type CmDropdownPlacement = 'bottom-start' | 'bottom-end';
export type CmDropdownVariant = 'default' | 'pills';

export interface CmDropdownTriggerScope {
  open: boolean;
  disabled: boolean;
  toggle: (event?: MouseEvent) => void;
}

export interface CmDropdownContentScope {
  open: boolean;
  close: () => void;
}

export interface CmDropdownProps {
  id: string;
  label: string;
  items?: readonly CmMenuItem[];
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: CmDropdownPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  triggerAsChild?: boolean;
  showArrow?: boolean;
  closeOnSelect?: boolean;
  variant?: CmDropdownVariant;
}

export interface VfDropdownProps extends Omit<CmDropdownProps, 'id' | 'label'> {
  id?: string;
  label?: string;
}
