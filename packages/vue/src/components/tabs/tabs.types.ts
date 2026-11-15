export interface CmTabItem {
  value: string;
  label: string;
  content?: string;
  disabled?: boolean;
  tabId?: string;
  panelId?: string;
}

export interface CmTabsProps {
  id?: string;
  items: readonly CmTabItem[];
  modelValue?: string | null;
  defaultValue?: string | null;
  scrollControls?: boolean;
}

export type VfTabItem = CmTabItem;
export type VfTabsProps = Omit<CmTabsProps, 'id'>;
