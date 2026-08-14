export type CmIconButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type CmIconButtonSize = 'sm' | 'md' | 'lg';

export type CmIconButtonType = 'button' | 'submit' | 'reset';

export interface CmIconButtonProps {
  label: string;
  variant?: CmIconButtonVariant;
  size?: CmIconButtonSize;
  type?: CmIconButtonType;
  disabled?: boolean;
}
