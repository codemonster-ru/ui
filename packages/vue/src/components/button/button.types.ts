export const buttonVariants = [
  'primary',
  'secondary',
  'success',
  'info',
  'warn',
  'help',
  'danger',
  'contrast',
  'ghost',
] as const;
export type CmButtonVariant = (typeof buttonVariants)[number];

export type CmButtonSize = 'sm' | 'md' | 'lg';

export type CmButtonType = 'button' | 'submit' | 'reset';

export interface CmButtonProps {
  variant?: CmButtonVariant;
  size?: CmButtonSize;
  type?: CmButtonType;
  href?: string | null;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
}
