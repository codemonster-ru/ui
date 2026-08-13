export type CmAlertTone = 'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';

export interface CmAlertProps {
  tone?: CmAlertTone;
  title?: string | null;
}
