export type CmContainerElement = 'div' | 'main' | 'section';
export type CmContainerSize = 'md' | 'lg' | 'xl' | '2xl';

export interface CmContainerProps {
  as?: string;
  element?: CmContainerElement;
  size?: CmContainerSize | null;
  fluid?: boolean;
}
