// Platform-independent presentation rules for VfLink.
//
// Two rules, and deliberately nothing else. VfLink has two rendering branches
// - a native anchor, and a handoff to whatever a Vue application registers as
// `RouterLink` - and only the first is a cross-platform contract. What both
// branches share is decided here: the class list, and the one derivation the
// component makes for a native link attribute. What the router branch adds -
// resolving a component by name, passing `to` through untouched, the literal
// unresolved element Vue renders when nothing is registered - is Vue's, lives
// in the Vue adapter, and has no rule here to mirror. A `resolveLinkElement`
// or a route-to-href conversion would be the shared core inventing a
// navigation contract the reference never had.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

export type VfLinkUnderlineName = 'none' | 'hover' | 'always';
export type VfLinkToneName = 'default' | 'muted';

/**
 * The link root class list, in the order the reference emits it: the block,
 * the underline modifier, the tone modifier. `none` and `default` emit no
 * modifier at all rather than a `--none` or `--default` class.
 */
export function resolveLinkClasses(underline: VfLinkUnderlineName, tone: VfLinkToneName): string[] {
  const classes = ['vf-link'];

  if (underline === 'hover') classes.push('vf-link--underline-hover');
  if (underline === 'always') classes.push('vf-link--underline-always');
  if (tone === 'muted') classes.push('vf-link--muted');

  return classes;
}

/**
 * The `rel` a link writes.
 *
 * An explicit `rel` wins as given - it is not merged with the default. With no
 * explicit `rel`, `target="_blank"` derives `noopener noreferrer`; every other
 * target, and no target, derives nothing. The explicit value is tested for
 * truthiness, so an empty string is "not given" and the derivation still
 * applies.
 *
 * Returns undefined when no attribute is written, because the reference writes
 * no `rel` attribute at all rather than an empty one.
 */
export function resolveLinkRel(rel: string | null | undefined, target: string | null | undefined): string | undefined {
  if (rel) return rel;

  return target === '_blank' ? 'noopener noreferrer' : undefined;
}
