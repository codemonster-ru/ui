export type CmInlineElement = 'div' | 'nav' | 'ul';

export interface CmInlineProps {
  as?: string;
  element?: CmInlineElement;
  wrap?: boolean;
}
