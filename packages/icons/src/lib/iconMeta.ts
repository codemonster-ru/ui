import iconGroupsJson from './iconMeta.json';
import iconCatalogJson from './iconCatalog.json';
import iconCoreJson from './iconCore.json';
import iconShowcaseJson from './iconShowcase.json';
import type { IconVariant } from './iconVariants';

type IconGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icons: string[];
};

export const iconGroups = iconGroupsJson as IconGroup[];

export const iconNames = /* @__PURE__ */ iconGroups.flatMap((group) => group.icons);

export type IconName = (typeof iconNames)[number];

export type IconCatalogEntry = {
  title: string;
  keywords: string[];
  variants: IconVariant[];
  /** @deprecated Use `variants` to inspect the supported runtime styles. */
  style: 'solid' | 'outline';
  brand?: {
    source: string;
    guidelines?: string;
    license?: string;
    isTrademark?: boolean;
  };
};

export type IconShowcaseEntry = {
  icon: IconName;
  status: 'approved' | 'in_progress';
  note: string;
};

const toKebabCase = (iconName: string) => {
  return iconName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
};

export const icons = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.fromEntries(/* @__PURE__ */ iconNames.map((iconName) => [iconName, toKebabCase(iconName)])),
) as Readonly<Record<IconName, string>>;

export const iconCatalog = iconCatalogJson as Record<IconName, IconCatalogEntry>;
export const coreIconNames = iconCoreJson as IconName[];
export const showcaseIconEntries = iconShowcaseJson as IconShowcaseEntry[];
