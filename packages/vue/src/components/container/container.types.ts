export type CmContainerElement = 'div' | 'main' | 'section';
export type CmContainerSize = 'md' | 'lg' | 'xl' | '2xl';

export interface CmContainerProps {
  element?: CmContainerElement;
  size?: CmContainerSize | null;
  fluid?: boolean;
}
