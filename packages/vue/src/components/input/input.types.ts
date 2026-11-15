export const cmInputTypes = ['text', 'email', 'number', 'password', 'search', 'tel', 'url'] as const;
export type CmInputType = (typeof cmInputTypes)[number];
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

export interface VfInputProps extends CmInputProps {
  leadingIcon?: string;
  trailingIcon?: string;
}
