export interface CmColumnChooserColumn {
  key: string;
  header?: string;
}

export interface CmColumnChooserProps {
  id: string;
  columns: readonly CmColumnChooserColumn[];
  visibleColumnKeys?: readonly string[] | null;
  requiredColumnKeys?: readonly string[];
  disabled?: boolean;
  triggerLabel?: string;
  allLabel?: string;
}
