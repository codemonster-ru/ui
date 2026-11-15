export type CmSetupLayoutAsidePosition = 'left' | 'right';

export interface CmSetupLayoutProps {
  as?: string;
  title?: string | null;
  description?: string | null;
  asidePosition?: CmSetupLayoutAsidePosition;
  fillViewport?: boolean;
  surface?: boolean;
  keyboardNavigation?: boolean;
}
