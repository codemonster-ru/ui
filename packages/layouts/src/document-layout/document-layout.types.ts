export type CmDocumentLayoutVariant = 'content' | 'sidebar-content' | 'sidebar-content-aside';

export interface CmDocumentLayoutProps {
  as?: string;
  layout?: CmDocumentLayoutVariant;
  fillViewport?: boolean;
  edgeNotches?: boolean;
  showSubheader?: boolean;
  showContentSubheader?: boolean;
  stickyHeader?: boolean;
  stickySidebar?: boolean;
  stickyAside?: boolean;
}

export const cmDocumentLayoutVariants: readonly CmDocumentLayoutVariant[] = [
  'content',
  'sidebar-content',
  'sidebar-content-aside',
];
