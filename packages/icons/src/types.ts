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

/** Gives each SVG instance its own masks, clip paths, and fragment references. */
export function scopeCmIconIds(body: string, scope: string): string {
  const prefix = scope.replace(/[^A-Za-z0-9_-]/gu, (char) => `_${char.codePointAt(0)?.toString(16)}_`);
  return body
    .replace(/(\s(?:id="|(?:xlink:)?href="#))([^"\s]+)(?=")/gu, `$1${prefix}-$2`)
    .replace(/url\(#([^\s)]+)\)/gu, `url(#${prefix}-$1)`);
}
