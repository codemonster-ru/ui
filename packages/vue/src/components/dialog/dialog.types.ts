export type CmDialogSize = 'sm' | 'md' | 'lg';

export interface CmDialogProps {
  id: string;
  title?: string;
  description?: string | null;
  open?: boolean;
  defaultOpen?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  closeLabel?: string;
  dismissible?: boolean;
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  focusDialog?: boolean;
  size?: CmDialogSize;
  dividers?: boolean;
}

export interface VfDialogProps extends Omit<CmDialogProps, 'id'> {
  id?: string;
}
