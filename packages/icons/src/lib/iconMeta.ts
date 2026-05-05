import iconGroupsJson from '@/lib/iconMeta.json';
import iconCatalogJson from '@/lib/iconCatalog.json';
import iconCoreJson from '@/lib/iconCore.json';
import iconDualStyleCoreJson from '@/lib/iconDualStyleCore.json';
import iconShowcaseJson from '@/lib/iconShowcase.json';

type IconGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icons: string[];
};

export const iconGroups = iconGroupsJson as IconGroup[];

export const iconNames = iconGroups.flatMap((group) => group.icons);

export type IconName = (typeof iconNames)[number];

export type IconCatalogEntry = {
  title: string;
  keywords: string[];
  style: 'solid';
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

export const icons = Object.freeze(
  Object.fromEntries(iconNames.map((iconName) => [iconName, toKebabCase(iconName)])),
) as Readonly<Record<IconName, string>>;

export const iconCatalog = iconCatalogJson as Record<IconName, IconCatalogEntry>;
export const coreIconNames = iconCoreJson as IconName[];
export const dualStyleCoreIconNames = iconDualStyleCoreJson as IconName[];
export const showcaseIconEntries = iconShowcaseJson as IconShowcaseEntry[];
