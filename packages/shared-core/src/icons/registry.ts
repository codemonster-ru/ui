// Neutral icon registry.
//
// The Vue icons package remains the geometry owner. `icon-registry.json` is
// generated from it by scripts/build/generate-icon-registry.mjs and checked for
// drift by `npm run check:icon-data`, so this module is a typed view over a
// derived artifact rather than a second source of truth.
//
// It covers every glyph the icons package publishes, not a per-component
// subset: M10 replaced VfInput's three-glyph blob with this registry so that
// migrating a component needs no icon work at all.
import iconRegistry from './icon-registry.json' with { type: 'json' };

export interface VfIconData {
  /** Class of the wrapping element the Vue icon renders. */
  wrapperClass: string;
  /**
   * Inline custom properties the Vue icon sets on that wrapper.
   *
   * Per-icon data, not layout: the optical offset and scale differ per glyph.
   * The layout itself is CSS both adapters load from
   * packages/styles/src/components/icon.css.
   */
  wrapperStyle: string;
  /** Presentation attributes of the `svg` element, without width/height. */
  attributes: Readonly<Record<string, string>>;
  /** Inner markup of the `svg` element. */
  body: string;
}

export type VfIconName = string;

export const vfIcons: Readonly<Record<string, VfIconData>> = iconRegistry.icons;

export function getIcon(name: VfIconName): VfIconData {
  const icon = vfIcons[name];

  if (!icon) {
    throw new Error(`Unknown VueForge icon: ${name}`);
  }

  return icon;
}

/**
 * Which glyph the password reveal action shows.
 *
 * Historical rule: the eye is offered while the password is hidden, and the
 * struck-through eye while it is revealed.
 */
export function resolvePasswordRevealIcon(passwordRevealed: boolean): VfIconName {
  return passwordRevealed ? 'eye-slash' : 'eye';
}
