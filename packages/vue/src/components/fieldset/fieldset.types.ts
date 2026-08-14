export interface CmFieldsetProps {
  id: string;
  label: string;
  description?: string | null;
  error?: string | null;
  invalid?: boolean;
}

export interface CmFieldsetDefaultSlotProps {
  describedBy?: string;
  invalid: boolean;
}
