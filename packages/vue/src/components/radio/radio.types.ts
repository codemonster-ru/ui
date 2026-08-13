export type CmRadioSize = 'sm' | 'md' | 'lg';

export interface CmRadioProps {
  modelValue?: string;
  value: string;
  label?: string;
  size?: CmRadioSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}
