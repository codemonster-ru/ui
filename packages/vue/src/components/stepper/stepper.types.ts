export type CmStepperOrientation = 'horizontal' | 'vertical';
export type CmStepperContentPosition = 'bottom' | 'inline';

export interface CmStepperItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CmStepperProps {
  items: readonly CmStepperItem[];
  value?: string | null;
  orientation?: CmStepperOrientation;
  contentPosition?: CmStepperContentPosition;
  ariaLabel?: string;
}
