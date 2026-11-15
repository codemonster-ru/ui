export type CmStepperOrientation = 'horizontal' | 'vertical';
export type VfStepperContentPosition = 'above' | 'below' | 'start' | 'end';
export type CmStepperContentPosition = VfStepperContentPosition | 'bottom' | 'inline';

export interface CmStepperItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CmStepperProps {
  items: readonly CmStepperItem[];
  value?: string | null;
  modelValue?: string;
  defaultValue?: string;
  orientation?: CmStepperOrientation;
  contentPosition?: CmStepperContentPosition;
  ariaLabel?: string;
}

export type VfStepperItem = CmStepperItem;
export type VfStepperOrientation = CmStepperOrientation;
export type VfStepperProps = Omit<CmStepperProps, 'value' | 'contentPosition'> & {
  contentPosition?: VfStepperContentPosition;
};
