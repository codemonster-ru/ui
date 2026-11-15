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

export type VfRadioValue = string | number | boolean;

export interface VfRadioProps extends Omit<CmRadioProps, 'modelValue' | 'value'> {
  modelValue?: VfRadioValue;
  value: VfRadioValue;
}
