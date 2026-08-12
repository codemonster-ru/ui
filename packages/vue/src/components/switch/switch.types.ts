export type CmSwitchSize = 'sm' | 'md' | 'lg';

export interface CmSwitchProps {
  modelValue?: boolean;
  value?: string;
  label?: string;
  size?: CmSwitchSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}
