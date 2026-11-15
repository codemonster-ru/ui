import type { Component } from 'vue';

export interface CmBreadcrumbItem {
  label: string;
  href?: string;
  to?: string | Record<string, unknown>;
  target?: string;
  rel?: string;
  current?: boolean;
  disabled?: boolean;
}

export interface CmBreadcrumbsProps {
  items: readonly CmBreadcrumbItem[];
  ariaLabel?: string;
  component?: string | Component;
}

export type VfBreadcrumbItem = CmBreadcrumbItem;
export type VfBreadcrumbsProps = CmBreadcrumbsProps;
