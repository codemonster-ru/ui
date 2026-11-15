export type CmDrawerSide = 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom';
export type CmDrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface CmDrawerProps {
  id: string;
  title?: string;
  description?: string | null;
  open?: boolean;
  defaultOpen?: boolean;
  side?: CmDrawerSide;
  closeLabel?: string;
  dismissible?: boolean;
  closable?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  focusDrawer?: boolean;
  size?: CmDrawerSize;
  dividers?: boolean;
  rounded?: boolean;
  offsetTop?: number | string;
  bodyPadding?: number | string;
}

export type VfDrawerPlacement = Exclude<CmDrawerSide, 'start' | 'end'>;
export interface VfDrawerProps extends Omit<CmDrawerProps, 'id' | 'side'> {
  id?: string;
  placement?: VfDrawerPlacement;
}
