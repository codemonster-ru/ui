export type CmDatePickerSize = 'sm' | 'md' | 'lg';

export interface CmDatePickerProps {
  modelValue?: string;
  min?: string | null;
  max?: string | null;
  size?: CmDatePickerSize;
  invalid?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
}
