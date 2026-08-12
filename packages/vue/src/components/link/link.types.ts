export type CmLinkUnderline = 'none' | 'hover' | 'always';
export type CmLinkTone = 'default' | 'muted';

export interface CmLinkProps {
  href: string;
  underline?: CmLinkUnderline;
  tone?: CmLinkTone;
}
