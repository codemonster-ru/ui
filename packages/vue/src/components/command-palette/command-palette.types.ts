export interface CmCommandPaletteItem {
  id: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
}

export interface CmCommandPaletteProps {
  id: string;
  title: string;
  commands: readonly CmCommandPaletteItem[];
  open?: boolean;
  query?: string;
  loading?: boolean;
  placeholder?: string;
  loadingText?: string;
  idleText?: string;
  emptyText?: string;
  closeLabel?: string;
}
