export type CmCardElement = 'section' | 'article' | 'div';

export interface CmCardProps {
  element?: CmCardElement;
  title?: string | null;
  compact?: boolean;
}
