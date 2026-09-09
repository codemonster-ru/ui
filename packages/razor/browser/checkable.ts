// Browser enhancement for the server-rendered checkable controls.
//
// There is exactly one thing here, and only VfCheckbox needs it.
//
// `indeterminate` is a DOM property with no HTML attribute behind it. A
// server-rendered checkbox can emit the class and the aria-checked="mixed" that
// go with the state - and does - but it cannot put the property itself in
// markup, because HTML has nowhere to put it. So this file sets the property on
// the checkboxes the server marked, and nothing else.
//
// What this deliberately does NOT do:
//
//   - VfRadio ships no controller. Radios sharing a name are mutually exclusive
//     because the browser makes them so; a group runtime would re-implement the
//     platform.
//   - VfSwitch ships no controller. It is a native checkbox with a role.
//   - Nothing here tracks checked state. The browser owns that on all three,
//     and a second writer would be the dual-mutation problem M11 removed.
//
// Ownership, for the one observable this file has: the server renders the
// initial indeterminate class and aria-checked; this sets the property to match
// once. After that the user owns the checkbox, and clicking it clears
// indeterminate natively - exactly as it does for a plain HTML checkbox.

const ROOT_SELECTOR = '[data-vf-razor="checkbox-indeterminate"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-checkbox-enhanced';

/**
 * Sets the indeterminate property on every Razor-marked checkbox inside `root`.
 *
 * Idempotent: a control is enhanced once, so calling this again after inserting
 * markup only picks up the new ones.
 */
export function enhanceVueForgeCheckables(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLInputElement]
      : Array.from(root.querySelectorAll<HTMLInputElement>(ROOT_SELECTOR));

  for (const control of roots) {
    if (control.hasAttribute(ENHANCED_ATTRIBUTE)) {
      continue;
    }

    control.setAttribute(ENHANCED_ATTRIBUTE, '');
    control.indeterminate = true;
  }
}
