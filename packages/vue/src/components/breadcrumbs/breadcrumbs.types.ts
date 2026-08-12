export interface CmBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  disabled?: boolean;
}

export interface CmBreadcrumbsProps {
  items: readonly CmBreadcrumbItem[];
  ariaLabel?: string;
}
