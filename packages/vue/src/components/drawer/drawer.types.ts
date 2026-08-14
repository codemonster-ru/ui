export type CmDrawerSide = 'start' | 'end';
export type CmDrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface CmDrawerProps {
  id: string;
  title: string;
  description?: string | null;
  open?: boolean;
  side?: CmDrawerSide;
  closeLabel?: string;
  dismissible?: boolean;
  size?: CmDrawerSize;
  dividers?: boolean;
  rounded?: boolean;
}
