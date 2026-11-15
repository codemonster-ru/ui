export type CmTooltipDelay = 'none' | 'short' | 'long';
export type CmTooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface CmTooltipProps {
  id?: string;
  label?: string;
  content?: string;
  text?: string;
  defaultVisible?: boolean;
  placement?: CmTooltipPlacement;
  delay?: CmTooltipDelay;
  openDelay?: number;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
}

export type VfTooltipPlacement = Extract<CmTooltipPlacement, 'top' | 'bottom'>;

export interface VfTooltipProps {
  text?: string;
  placement?: VfTooltipPlacement;
  openDelay?: number;
  teleportTo?: CmTooltipProps['teleportTo'];
  disableTeleport?: boolean;
}
