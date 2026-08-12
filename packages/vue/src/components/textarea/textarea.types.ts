export type CmTextareaSize = 'sm' | 'md' | 'lg';

export interface CmTextareaProps {
  modelValue?: string;
  size?: CmTextareaSize;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
}
