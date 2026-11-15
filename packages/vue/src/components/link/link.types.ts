import type { Component } from 'vue';

export type CmLinkUnderline = 'none' | 'hover' | 'always';
export type CmLinkTone = 'default' | 'muted';

export interface CmLinkProps {
  href?: string;
  to?: string | Record<string, unknown>;
  target?: string;
  rel?: string;
  component?: string | Component;
  underline?: CmLinkUnderline;
  tone?: CmLinkTone;
}
