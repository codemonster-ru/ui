export type CmSetupLayoutAsidePosition = 'left' | 'right';

export interface CmSetupLayoutProps {
  title?: string | null;
  description?: string | null;
  asidePosition?: CmSetupLayoutAsidePosition;
  keyboardNavigation?: boolean;
}
