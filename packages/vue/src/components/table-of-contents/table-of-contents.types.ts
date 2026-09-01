export type CmTableOfContentsVariant = 'default' | 'pills';

export interface CmTableOfContentsItem {
  id: string;
  label: string;
  level?: number;
  href?: string;
}

export interface CmTableOfContentsProps {
  items: readonly CmTableOfContentsItem[];
  activeId?: string | null;
  ariaLabel?: string;
  smooth?: boolean;
  scrollOffset?: number;
  variant?: CmTableOfContentsVariant;
}
