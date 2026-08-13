export type CmTooltipDelay = 'none' | 'short' | 'long';
export type CmTooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface CmTooltipProps {
  id: string;
  label: string;
  content: string;
  defaultVisible?: boolean;
  placement?: CmTooltipPlacement;
  delay?: CmTooltipDelay;
}
