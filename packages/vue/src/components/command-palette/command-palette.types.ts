import type { VfModalPortalProps } from '../modal/modal-portal';

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
  defaultOpen?: boolean;
  query?: string;
  defaultQuery?: string;
  loading?: boolean;
  placeholder?: string;
  loadingText?: string;
  idleText?: string;
  emptyText?: string;
  closeLabel?: string;
  filter?: boolean;
  autoActivate?: boolean;
  closeOnSelect?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  dividers?: boolean;
  maxHeight?: string | number;
}

export interface VfCommandPaletteProps extends VfModalPortalProps {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  placeholder?: string;
  modelValue?: string;
  defaultValue?: string;
  items?: readonly unknown[];
  loading?: boolean;
  idleText?: string;
  emptyText?: string;
  highlightMatches?: boolean;
  dividers?: boolean;
  closeOnSelect?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  maxHeight?: string | number;
  showDefaultFooterHints?: boolean;
}
