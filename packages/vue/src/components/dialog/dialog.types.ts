export type CmDialogSize = 'sm' | 'md' | 'lg';

export interface CmDialogProps {
  id: string;
  title: string;
  description?: string | null;
  open?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
  size?: CmDialogSize;
  dividers?: boolean;
}
