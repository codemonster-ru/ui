export type CmPopoverPlacement = 'top' | 'bottom-start' | 'bottom-end';

export interface CmPopoverProps {
  id: string;
  label: string;
  open?: boolean;
  disabled?: boolean;
  placement?: CmPopoverPlacement;
}
