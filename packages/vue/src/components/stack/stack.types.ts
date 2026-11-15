export type CmStackElement = 'div' | 'section' | 'ul' | 'ol';

export interface CmStackProps {
  as?: string;
  element?: CmStackElement;
}
