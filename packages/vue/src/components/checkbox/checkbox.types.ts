export type CmCheckboxSize = 'sm' | 'md' | 'lg';

export interface CmCheckboxProps {
  modelValue?: boolean;
  value?: string;
  label?: string;
  size?: CmCheckboxSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
}
