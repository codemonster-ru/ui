// Neutral icon data for the VfInput action controls.
//
// The Vue icons package remains the geometry owner. `input-icon-data.json` is
// generated from it by scripts/build/generate-input-icon-data.mjs and checked
// for drift by `npm run check:icon-data`, so this module is a typed view over a
// derived artifact rather than a second source of truth.
//
// Only the three glyphs the Input closure needs are here. Migrating the icon
// system is a separate milestone.
import inputIconData from './input-icon-data.json' with { type: 'json' };

export interface VfIconData {
  /** Class of the wrapping element the Vue icon renders. */
  wrapperClass: string;
  /** Inline custom properties the Vue icon sets on that wrapper. */
  wrapperStyle: string;
  /** Presentation attributes of the `svg` element, without width/height. */
  attributes: Readonly<Record<string, string>>;
  /** Inner markup of the `svg` element. */
  body: string;
}

export type VfInputIconName = 'xmark' | 'eye' | 'eye-slash';

export const vfInputIcons: Readonly<Record<VfInputIconName, VfIconData>> = inputIconData.icons;

export function getInputIcon(name: VfInputIconName): VfIconData {
  const icon = vfInputIcons[name];

  if (!icon) {
    throw new Error(`Unknown VfInput icon: ${name}`);
  }

  return icon;
}

/**
 * Which glyph the password reveal action shows.
 *
 * Historical rule: the eye is offered while the password is hidden, and the
 * struck-through eye while it is revealed.
 */
export function resolvePasswordRevealIcon(passwordRevealed: boolean): VfInputIconName {
  return passwordRevealed ? 'eye-slash' : 'eye';
}
