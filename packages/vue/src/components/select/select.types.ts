export type CmSelectSize = 'sm' | 'md' | 'lg';
export type CmSelectPlacement = 'bottom-start' | 'bottom-end';

export interface CmSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CmSelectProps {
  id: string;
  options: readonly CmSelectOption[];
  modelValue?: string;
  placeholder?: string | null;
  size?: CmSelectSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  placement?: CmSelectPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
}

export interface VfSelectProps extends Omit<CmSelectProps, 'id'> {
  id?: string;
  leadingIcon?: string;
  trailingIcon?: string;
}
