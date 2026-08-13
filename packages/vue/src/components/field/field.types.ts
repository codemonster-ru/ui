export interface CmFieldProps {
  controlId: string;
  label?: string | null;
  description?: string | null;
  error?: string | null;
  invalid?: boolean;
  required?: boolean;
}

export interface CmFieldDefaultSlotProps {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}
