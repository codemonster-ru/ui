// Platform-independent rules for VfGroupBox.
//
// What the props decide, and nothing that is held. As for VfAccordion, the
// state itself is not extracted: the Vue adapter keeps it in the useDisclosure
// composable, and the Razor adapter keeps it in the server-rendered
// aria-expanded attribute its controller reads. A shared class with a toggle
// would give both a second copy to keep in sync.
//
// Four decisions, each one the server has to make before any script runs and
// the browser controller has to repeat on a toggle:
//
//   - whether the group has a title at all, which is JavaScript truthiness of
//     the prop plus the presence of a title slot;
//   - the open state the collapsed and defaultCollapsed props resolve to;
//   - whether the disclosure exists, whether it is collapsed now, and whether
//     a gesture may toggle it;
//   - the root's class list.
//
// Reading the slots, the emits, the trigger markup and the content lifecycle
// are adapter behaviour and stay in each adapter.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/**
 * Whether the group has a title.
 *
 * `Boolean(title) || Boolean(slots.title)` in the reference. JavaScript
 * truthiness of a string: "" is no title and "0" is one. A PHP port must not
 * restate this with PHP truthiness, where "0" is false - the vector file pins
 * both spellings. The slot counts by its presence, whatever it renders.
 */
export function resolveGroupBoxHasTitle(title: string | undefined, hasTitleSlot: boolean): boolean {
  return Boolean(title) || hasTitleSlot;
}

/**
 * The open state the props resolve to before any interaction.
 *
 * The reference hands `useDisclosure` `open: collapsed === undefined ?
 * undefined : !collapsed` and `defaultOpen: !defaultCollapsed`, so a defined
 * `collapsed` wins and `defaultCollapsed` seeds the state otherwise. As in the
 * accordion's rule, `undefined` is the only absence; the Razor adapter maps its
 * null-attribute convention onto absence before the rule runs.
 */
export function resolveGroupBoxOpen(collapsed: boolean | undefined, defaultCollapsed: boolean | undefined): boolean {
  return collapsed !== undefined ? !collapsed : !defaultCollapsed;
}

export interface GroupBoxFlagsInput {
  hasTitle: boolean;
  collapsible: boolean | undefined;
  open: boolean;
  disabled: boolean | undefined;
}

export interface GroupBoxFlags {
  /** The disclosure exists: collapsible was asked for and there is a title to put the trigger in. */
  collapsible: boolean;
  /** The content is removed: only a collapsible group can be collapsed. */
  collapsed: boolean;
  /** A gesture may toggle it now: the reference's `isCollapsible && !props.disabled` guard. */
  toggleable: boolean;
}

/**
 * The disclosure flags.
 *
 * `disabled` is read with JavaScript truthiness, exactly as the reference's
 * guard reads it - which is why the string "true", a Vue type misuse that
 * leaves the native button operable, still refuses the toggle.
 */
export function resolveGroupBoxFlags({ hasTitle, collapsible, open, disabled }: GroupBoxFlagsInput): GroupBoxFlags {
  const isCollapsible = Boolean(collapsible) && hasTitle;

  return {
    collapsible: isCollapsible,
    collapsed: isCollapsible && !open,
    toggleable: isCollapsible && !disabled,
  };
}

/** The root's class list, in the order the reference emits it. A consumer class follows these. */
export function resolveGroupBoxClasses({
  hasTitle,
  collapsible,
  collapsed,
}: {
  hasTitle: boolean;
  collapsible: boolean;
  collapsed: boolean;
}): string[] {
  const classes = ['vf-group-box'];

  if (hasTitle) classes.push('vf-group-box--titled');
  if (collapsible) classes.push('vf-group-box--collapsible');
  if (collapsed) classes.push('vf-group-box--collapsed');

  return classes;
}
