export type CmButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type CmButtonSize = 'sm' | 'md' | 'lg';

export type CmButtonType = 'button' | 'submit' | 'reset';

export interface CmButtonProps {
  variant?: CmButtonVariant;
  size?: CmButtonSize;
  type?: CmButtonType;
  href?: string | null;
  disabled?: boolean;
  loading?: boolean;
}
