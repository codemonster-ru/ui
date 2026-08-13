export type CmDrawerSide = 'start' | 'end';

export interface CmDrawerProps {
  id: string;
  title: string;
  description?: string | null;
  open?: boolean;
  side?: CmDrawerSide;
  closeLabel?: string;
}
