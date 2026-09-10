// Platform-independent presentation rules for VfAvatar.
//
// Its own file for the same reason skeleton/state.ts is: nothing here is shared
// with another component, and grouping unrelated components under one module
// name is how a rule ends up being reused by something it was never written
// for.
//
// The rule that matters is resolveAvatarBranch. VfAvatar has four mutually
// exclusive content channels and the reference picks between them with a
// v-if/v-else-if chain, so the order is not an implementation detail a port may
// re-derive - it is the public contract. An avatar given both an image and a
// label shows the image; one given a label and an icon shows the label; the
// default slot is reached only when the other three are absent.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The literals `VfControlSize` allows for an avatar. Duplicated from the Vue type on purpose: shared-core may not import the adapter. */
export type VfAvatarSizeName = 'sm' | 'md' | 'lg';

/** The literals `VfAvatarShape` allows. */
export type VfAvatarShapeName = 'square' | 'circle';

/** Which of the four content channels a given set of props actually renders. */
export type VfAvatarBranch = 'image' | 'label' | 'icon' | 'slot';

/**
 * The avatar root class list, in the order the reference emits it.
 *
 * Both modifiers are suppressed at their default, and they are suppressed by
 * two different rules: the size compares against `md`, the shape compares
 * against `circle`. Writing this as one "emit the modifier unless it is the
 * default" loop would read better and would be wrong the moment a third shape
 * appears, because `square` is not the shape the modifier is named after.
 */
export function resolveAvatarClasses(size: string, shape: string): string[] {
  const classes = ['vf-avatar'];

  if (size !== 'md') classes.push(`vf-avatar--${size}`);
  if (shape === 'circle') classes.push('vf-avatar--circle');

  return classes;
}

/**
 * Which content channel wins.
 *
 * The chain is image → label → icon → default slot, and each test is a plain
 * truthiness check because that is what `v-if="props.image"` compiles to. So an
 * empty string does not select its branch: `image: ''` falls through to the
 * label exactly as an absent image does, and there is no way for a caller to
 * ask for an empty image or an empty label.
 *
 * The default slot is the only branch with no condition of its own - it is
 * whatever is left. That means an avatar with no props and no slot content is a
 * valid, empty avatar rather than an error.
 */
export function resolveAvatarBranch(content: {
  image?: string | null;
  label?: string | null;
  icon?: string | null;
}): VfAvatarBranch {
  if (content.image) return 'image';
  if (content.label) return 'label';
  if (content.icon) return 'icon';

  return 'slot';
}
