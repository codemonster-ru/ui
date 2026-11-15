export type CmSectionElement = 'section' | 'div' | 'article' | 'aside';

export interface CmSectionProps {
  as?: string;
  element?: CmSectionElement;
  surface?: boolean;
}
