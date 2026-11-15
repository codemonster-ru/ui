export type CmSwitchSize = 'sm' | 'md' | 'lg';
export type CmSwitchThumbContrast = 'auto' | 'inverse';

export interface CmSwitchProps {
  modelValue?: boolean;
  value?: string;
  label?: string;
  size?: CmSwitchSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  static?: boolean;
  thumbContrast?: CmSwitchThumbContrast;
}
