/** One rendered form of an icon, keyed `family/variant`. */
export interface CmIconRendering {
  readonly body: string;
  readonly viewBox: string;
}

/**
 * Every form an icon has.
 *
 * Not every icon has every form, and that is a fact rather than a gap: a brand mark has one
 * canonical rendering, so there is no thin-stroke GitHub logo to record.
 */
export type CmIconGeometry = Readonly<Record<string, CmIconRendering>>;

export type CmIconFamily = 'classic' | 'duotone';
export type CmIconVariant = 'light' | 'regular' | 'solid' | 'thin';

export const cmIconFamilies: readonly CmIconFamily[] = ['classic', 'duotone'];
export const cmIconVariants: readonly CmIconVariant[] = ['solid', 'regular', 'light', 'thin'];

/** Reads one rendering out of an icon, falling back to the form a brand mark actually has. */
export function resolveCmIcon(
  geometry: CmIconGeometry,
  family: CmIconFamily,
  variant: CmIconVariant,
): CmIconRendering | null {
  return geometry[`${family}/${variant}`] ?? geometry['classic/solid'] ?? null;
}
