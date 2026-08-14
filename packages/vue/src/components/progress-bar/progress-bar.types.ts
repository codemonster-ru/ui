export type CmProgressBarTone = 'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';

export interface CmProgressBarProps {
  label: string;
  value?: number;
  max?: number;
  indeterminate?: boolean;
  showValue?: boolean;
  tone?: CmProgressBarTone;
}
