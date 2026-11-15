import type { CmIconFamily, CmIconGeometry, CmIconVariant } from '@codemonster-ru/ui-icons';

export type { CmIconFamily, CmIconGeometry, CmIconVariant };

export interface VueIconifyProps {
  icon?: string;
  spin?: boolean;
  size?: number | string;
  inset?: number;
  variant?: CmIconVariant;
  family?: CmIconFamily;
  secondaryColor?: string;
  secondaryOpacity?: number | string;
}
