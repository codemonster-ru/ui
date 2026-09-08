// Browser enhancement for the Razor VfField.
//
// The field is complete when it arrives: the label, its association with the
// control, the description, the error, and the floating and filled classes are
// all rendered by the server, which knows every input to those decisions.
// Exactly one of them can change afterwards - whether the control still holds a
// value - so that is the only thing this file owns.
//
// Ownership is the point. Before M11 the input controller reached out of its
// own subtree and wrote the field's classes, because there was no field
// component to own them; that is the shape of the dual-DOM-mutation problem the
// first migration failed on. Now:
//
//   the field controller writes  vf-field__control--filled
//   the input controller writes  everything inside vf-input / vf-input-wrap
//
// Neither writes the other's attributes, and nothing writes the floating
// classes at runtime at all - they are static, because placement and label
// presence cannot change without a re-render from the server.
import { isInputFilled } from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="field"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-field-enhanced';

/**
 * The control element this field owns.
 *
 * Scoped to the nearest field on purpose: a field nested inside another field's
 * slot must not have its state driven by the outer one.
 */
function ownControl(root: HTMLElement): HTMLInputElement | null {
  for (const candidate of root.querySelectorAll<HTMLInputElement>('input')) {
    if (candidate.closest(ROOT_SELECTOR) === root) {
      return candidate;
    }
  }

  return null;
}

function ownControlWrapper(root: HTMLElement): HTMLElement | null {
  for (const candidate of root.querySelectorAll<HTMLElement>('.vf-field__control')) {
    if (candidate.closest(ROOT_SELECTOR) === root) {
      return candidate;
    }
  }

  return null;
}

function enhanceRoot(root: HTMLElement): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) {
    return;
  }

  const control = ownControl(root);
  const wrapper = ownControlWrapper(root);

  if (!control || !wrapper) {
    return;
  }

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const sync = (): void => {
    wrapper.classList.toggle('vf-field__control--filled', isInputFilled(control.value));
  };

  // `input` covers typing; `change` covers autofill and programmatic commits
  // that skip it. Both are listened for on the control this field owns, so a
  // sibling field's control cannot drive this one.
  control.addEventListener('input', sync);
  control.addEventListener('change', sync);
  // The clear action rewrites the value and dispatches input, so it arrives
  // through the same path rather than needing a second bridge.
  sync();
}

/**
 * Enhances every Razor-owned field inside `root`.
 *
 * Idempotent: a field is enhanced once, so calling this again after inserting
 * markup only picks up the new fields.
 */
export function enhanceVueForgeFields(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element);
  }
}
