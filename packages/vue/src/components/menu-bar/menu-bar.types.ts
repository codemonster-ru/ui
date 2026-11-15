import type { CmIconGeometry } from '@codemonster-ru/ui-icons';
import type { CmLinkProps } from '../link/link.types';
import type { VfNavMenuItem } from '../nav-menu/nav-menu.types';

export type CmMenuBarVariant = 'default' | 'pills';

export interface CmMenuBarItem {
  value: string;
  label: string;
  kind?: 'item' | 'group';
  leadingIcon?: CmIconGeometry;
  href?: string;
  to?: CmLinkProps['to'];
  target?: string;
  rel?: string;
  disabled?: boolean;
  children?: CmMenuBarItem[];
}

export interface CmMenuBarProps {
  items: readonly CmMenuBarItem[];
  openPath?: readonly string[] | null;
  modelValue?: string | null;
  defaultValue?: string | null;
  variant?: CmMenuBarVariant;
  ariaLabel?: string;
  linkComponent?: CmLinkProps['component'];
}

export interface VfMenuBarProps {
  items: readonly VfNavMenuItem[];
  openPath?: readonly string[] | null;
  modelValue?: string;
  defaultValue?: string;
  variant?: CmMenuBarVariant;
  ariaLabel?: string;
  linkComponent?: CmLinkProps['component'];
}
