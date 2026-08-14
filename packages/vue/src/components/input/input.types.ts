export type CmInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
export type CmInputSize = 'sm' | 'md' | 'lg';

export interface CmInputProps {
  modelValue?: string;
  type?: CmInputType;
  size?: CmInputSize;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  clearable?: boolean;
  passwordReveal?: boolean;
  clearLabel?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}
