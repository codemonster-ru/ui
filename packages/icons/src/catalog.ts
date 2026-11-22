import catalog from './catalog-data/catalog.json' with { type: 'json' };
import core from './catalog-data/core.json' with { type: 'json' };
import groups from './catalog-data/groups.json' with { type: 'json' };
import type { cmIconNames } from './index.js';
import { cmIconFamilies, cmIconVariants, type CmIconFamily, type CmIconVariant } from './types.js';

export type IconName = (typeof cmIconNames)[number];
export type IconFamily = CmIconFamily;
export type IconVariant = CmIconVariant;
export type OutlineIconVariant = Exclude<IconVariant, 'solid'>;

export interface IconGroup {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly icons: readonly IconName[];
}

export interface IconCatalogEntry {
  readonly title: string;
  readonly keywords: readonly string[];
  readonly variants: readonly IconVariant[];
  /** The original inventory classified icons by their main style. Use variants for supported forms. */
  readonly style: 'solid' | 'outline';
  readonly brand?: Readonly<{
    source: string;
    guidelines?: string;
    license?: string;
    isTrademark?: boolean;
  }>;
}

/** Catalogue order, labels, keywords and brand attribution from the historical icon inventory. */
export const iconGroups = groups as readonly IconGroup[];
export const iconNames = Object.freeze(iconGroups.flatMap((group) => group.icons));
export const iconCatalog = catalog as Readonly<Record<IconName, IconCatalogEntry>>;
export const coreIconNames = core as readonly IconName[];

export const icons = Object.freeze(
  Object.fromEntries(iconNames.map((name) => [name, name.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)])),
) as Readonly<Record<IconName, string>>;

export const iconFamilies = cmIconFamilies;
export const iconVariants = cmIconVariants;
export const outlineIconVariants = ['regular', 'light', 'thin'] as const satisfies readonly OutlineIconVariant[];
