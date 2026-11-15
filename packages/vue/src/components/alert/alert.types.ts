export type CmAlertTone = 'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';

export interface CmAlertProps {
  tone?: CmAlertTone;
  title?: string | null;
}

export type VfAlertTone = CmAlertTone | 'warn';

export interface VfAlertProps {
  tone?: VfAlertTone;
  title?: string;
  icon?: string;
  hideIcon?: boolean;
}
