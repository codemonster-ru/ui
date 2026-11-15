import type { VfModalPortalProps } from '../modal/modal-portal';

export const cmDrawerSides = ['start', 'end', 'left', 'right', 'top', 'bottom'] as const;
export const cmDrawerSizes = ['sm', 'md', 'lg', 'full'] as const;
export type CmDrawerSide = (typeof cmDrawerSides)[number];
export type CmDrawerSize = (typeof cmDrawerSizes)[number];

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
export interface VfDrawerProps extends Omit<CmDrawerProps, 'id' | 'side'>, VfModalPortalProps {
  id?: string;
  placement?: VfDrawerPlacement;
  scrollLockTarget?: HTMLElement | null | false;
}
