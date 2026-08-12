export type CmSelectSize = 'sm' | 'md' | 'lg';

export interface CmSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CmSelectProps {
  options: readonly CmSelectOption[];
  modelValue?: string;
  placeholder?: string | null;
  size?: CmSelectSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}
