// Platform-independent VfIconButton presentation rules.
//
// VfIconButton holds no state: it has no emits, no slots and nothing to track
// between renders. What it does have is a class list and an icon size that two
// adapters would otherwise each derive from the same prop values, which is
// exactly the duplication M10 exists to stop. These two functions are that
// shared derivation.
//
// They record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** Variants the historical component's types allow. */
export type VfIconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast'
  | 'ghost';

/** Sizes the historical component's types allow. */
export type VfIconButtonSize = 'sm' | 'md' | 'lg';

export interface VfIconButtonAppearance {
  /** The `variant` prop; defaults to `ghost` at the call site, not here. */
  variant: string;
  /** The `size` prop; defaults to `md` at the call site, not here. */
  size: string;
}

/**
 * The canonical class list, in the order the reference emits it.
 *
 * Historical rules, both deliberate:
 *
 * - `md` emits no size modifier at all. The default size is expressed by the
 *   absence of a class rather than by `vf-icon-button--md`, so a stylesheet
 *   cannot target it by name.
 * - A value outside the documented union still reaches the class name. The
 *   reference interpolates the prop without validating it, so
 *   `variant="nonsense"` renders `vf-icon-button--nonsense`. An adapter that
 *   validated instead would be a different component.
 */
export function resolveIconButtonClasses({ variant, size }: VfIconButtonAppearance): string[] {
  const classes = ['vf-icon-button', `vf-icon-button--${variant}`];

  if (size !== 'md') {
    classes.push(`vf-icon-button--${size}`);
  }

  return classes;
}

/**
 * The CSS length handed to the icon for a given control size.
 *
 * Only `sm` and `lg` are special-cased; every other value, documented or not,
 * takes the medium token. So an unknown size produces a `--unknown` modifier
 * class and a medium glyph, which is what the reference does.
 */
export function resolveIconButtonIconSize(size: string): string {
  if (size === 'sm') {
    return 'var(--vf-icon-size-sm)';
  }

  if (size === 'lg') {
    return 'var(--vf-icon-size-lg)';
  }

  return 'var(--vf-icon-size-md)';
}
