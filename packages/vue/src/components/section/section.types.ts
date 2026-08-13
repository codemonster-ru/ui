export type CmSectionElement = 'section' | 'div' | 'article' | 'aside';

export interface CmSectionProps {
  element?: CmSectionElement;
  surface?: boolean;
}
