export interface CmDialogProps {
  id: string;
  title: string;
  description?: string | null;
  open?: boolean;
  closeLabel?: string;
  dismissible?: boolean;
}
