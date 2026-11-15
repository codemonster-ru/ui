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
  triggerAsChild?: boolean;
  teleportTo?: string | HTMLElement | null | false;
}

export interface CmColumnChooserTriggerScope {
  visibleColumnKeys: string[];
  disabled: boolean;
}

export interface VfDataTableColumnChooserProps extends Omit<CmColumnChooserProps, 'id' | 'visibleColumnKeys'> {
  id?: string;
  modelValue?: readonly string[];
}
