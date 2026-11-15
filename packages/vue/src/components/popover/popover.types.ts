export type CmPopoverPlacement = 'top' | 'bottom-start' | 'bottom-end';

export interface CmPopoverProps {
  id: string;
  label: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placement?: CmPopoverPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  focusOnOpen?: boolean;
}
