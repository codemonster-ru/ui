export type CmFieldLabelPlacement = 'top' | 'floating';
export type CmFieldFloatingVariant = 'in' | 'on' | 'over';

export interface CmFieldProps {
  controlId?: string;
  label?: string | null;
  description?: string | null;
  error?: string | null;
  invalid?: boolean;
  required?: boolean;
  labelPlacement?: CmFieldLabelPlacement;
  floatingVariant?: CmFieldFloatingVariant;
}

export interface CmFieldDefaultSlotProps {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}
