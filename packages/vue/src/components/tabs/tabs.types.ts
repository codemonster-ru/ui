export interface CmTabItem {
  value: string;
  label: string;
  content?: string;
  disabled?: boolean;
}

export interface CmTabsProps {
  id: string;
  items: readonly CmTabItem[];
  modelValue?: string | null;
  defaultValue?: string | null;
}
