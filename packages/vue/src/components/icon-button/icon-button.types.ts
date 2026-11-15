import type { CmButtonVariant } from '../button/button.types';

export type CmIconButtonVariant = CmButtonVariant;

export type CmIconButtonSize = 'sm' | 'md' | 'lg';

export type CmIconButtonType = 'button' | 'submit' | 'reset';

export interface CmIconButtonProps {
  label: string;
  variant?: CmIconButtonVariant;
  size?: CmIconButtonSize;
  type?: CmIconButtonType;
  disabled?: boolean;
}
