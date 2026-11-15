export type CmBadgeTone =
  'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'warn' | 'help' | 'danger' | 'contrast';

export interface CmBadgeProps {
  tone?: CmBadgeTone;
}
