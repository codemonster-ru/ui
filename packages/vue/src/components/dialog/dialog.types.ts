export type CmDialogSize = 'sm' | 'md' | 'lg';

export interface CmDialogProps {
  id: string;
  title: string;
  description?: string | null;
  open?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  focusDialog?: boolean;
  size?: CmDialogSize;
  dividers?: boolean;
}
