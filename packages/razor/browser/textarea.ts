// Browser enhancement for the server-rendered VfTextarea.
//
// The control arrives complete: its value is the element's text, its id and
// relationships come from the field around it, and its classes are decided by
// the server. Exactly one thing changes afterwards - whether it still holds a
// value - so that is the only thing this file owns.
//
// Ownership, kept deliberately narrow so nothing here collides with the field
// controller that runs beside it:
//
//   this file            data-vf-filled on the textarea
//   browser/field.ts     vf-field__control--filled on the field
//   the server           every class and relationship, which cannot change
//
// Neither controller writes the other's attributes, and both read the same
// native value rather than sharing state.
import { isInputFilled } from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="textarea"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-textarea-enhanced';

function enhanceRoot(control: HTMLTextAreaElement): void {
  if (control.hasAttribute(ENHANCED_ATTRIBUTE)) {
    return;
  }

  control.setAttribute(ENHANCED_ATTRIBUTE, '');

  const sync = (): void => {
    if (isInputFilled(control.value)) {
      control.setAttribute('data-vf-filled', 'true');
    } else {
      control.removeAttribute('data-vf-filled');
    }
  };

  // `input` covers typing; `change` covers autofill and programmatic commits
  // that skip it.
  control.addEventListener('input', sync);
  control.addEventListener('change', sync);
  sync();
}

/**
 * Enhances every Razor-owned textarea inside `root`.
 *
 * Idempotent: a control is enhanced once, so calling this again after inserting
 * markup only picks up the new ones.
 */
export function enhanceVueForgeTextareas(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLTextAreaElement]
      : Array.from(root.querySelectorAll<HTMLTextAreaElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element);
  }
}
