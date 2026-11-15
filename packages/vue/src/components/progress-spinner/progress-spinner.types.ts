export type CmProgressSpinnerSize = 'sm' | 'md' | 'lg';
export type CmProgressSpinnerTone =
  'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';

export interface CmProgressSpinnerProps {
  label: string;
  size?: CmProgressSpinnerSize;
  strokeWidth?: number;
  tone?: CmProgressSpinnerTone;
}

export interface VfProgressSpinnerProps {
  label?: string;
  size?: string | number;
  strokeWidth?: number;
  tone?: CmProgressSpinnerTone | 'warn';
}
