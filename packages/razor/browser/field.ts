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

// M32. A control that is not a text box declares itself instead of being
// guessed: the element carrying this marker is the control, and it reports
// its filled state with FILLED_CHANGE_EVENT (`detail.filled`). VfSelect puts
// the marker on its trigger - the select's filled is `value || open`, which
// no input's value says - so the hidden input it renders for a form name,
// the first <input> in the field, is never taken for the control.
const DECLARED_CONTROL_ATTRIBUTE = 'data-vf-razor-field-control';
const FILLED_CHANGE_EVENT = 'vf-field:filled-change';

/**
 * The control element this field owns.
 *
 * Scoped to the nearest field on purpose: a field nested inside another field's
 * slot must not have its state driven by the outer one.
 */
function ownControl(root: HTMLElement): HTMLInputElement | HTMLTextAreaElement | null {
  // Both controls a field can wrap. Selecting only `input` was correct while
  // VfInput was the only migrated control, and silently wrong the moment a
  // field wrapped a textarea: the field would have kept the filled state the
  // server rendered and never updated it.
  for (const candidate of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')) {
    if (candidate.closest(ROOT_SELECTOR) === root) {
      return candidate;
    }
  }

  return null;
}

function ownDeclaredControl(root: HTMLElement): HTMLElement | null {
  for (const candidate of root.querySelectorAll<HTMLElement>(`[${DECLARED_CONTROL_ATTRIBUTE}]`)) {
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

  const declared = ownDeclaredControl(root);
  const wrapper = ownControlWrapper(root);

  // The declared control reports; the server rendered the initial class.
  if (declared && wrapper) {
    root.setAttribute(ENHANCED_ATTRIBUTE, '');
    declared.addEventListener(FILLED_CHANGE_EVENT, (event) => {
      wrapper.classList.toggle('vf-field__control--filled', (event as CustomEvent<{ filled: boolean }>).detail.filled);
    });
    return;
  }

  const control = ownControl(root);

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
