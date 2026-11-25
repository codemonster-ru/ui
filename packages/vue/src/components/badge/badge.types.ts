export type CmBadgeTone =
  'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'warn' | 'help' | 'danger' | 'contrast';
export type CmBadgeVariant = 'filled' | 'outline';

export interface CmBadgeProps {
  tone?: CmBadgeTone;
  variant?: CmBadgeVariant;
}
