export type CmTagTone =
  'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'warn' | 'help' | 'danger' | 'contrast';

export interface CmTagProps {
  tone?: CmTagTone;
}
