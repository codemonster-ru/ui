// Browser enhancement for the server-rendered VfInput.
//
// Scope is deliberate and narrow. The controller only ever touches roots the
// Razor adapter rendered, found by their explicit ownership marker, and it
// owns every node inside such a root. It never searches for `.vf-input`, so a
// Vue-rendered control on the same page is invisible to it: one DOM owner per
// subtree.
//
// Decisions the two adapters share live in @codemonster-ru/vueforge-shared-core
// and are imported here. Everything in this file is the part that cannot be
// shared: listeners, focus, selection and DOM mutation.
import {
  getInputIcon,
  isClearActionAvailable,
  isInputFilled,
  isPasswordRevealAvailable,
  resolveInputAdornmentState,
  resolveInputType,
  resolvePasswordRevealIcon,
} from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="input"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-enhanced';

interface InputParts {
  root: HTMLElement;
  control: HTMLInputElement;
  wrapper: HTMLElement | null;
  clear: HTMLButtonElement | null;
  reveal: HTMLButtonElement | null;
  leadingAdornment: HTMLElement | null;
  trailingAdornment: HTMLElement | null;
  revealLabels: { show: string; hide: string };
}

/** The field shell a host may wrap the control in; see the package README. */
interface FieldParts {
  root: HTMLElement;
  control: HTMLElement;
  floating: boolean;
}

function findParts(root: HTMLElement): InputParts | null {
  const control =
    root instanceof HTMLInputElement ? root : root.querySelector<HTMLInputElement>('[data-vf-razor-input="control"]');

  if (!control) {
    return null;
  }

  const wrapper = root === control ? null : root;
  const reveal = wrapper?.querySelector<HTMLButtonElement>('[data-vf-razor-input="password-reveal"]') ?? null;

  return {
    root,
    control,
    wrapper,
    clear: wrapper?.querySelector<HTMLButtonElement>('[data-vf-razor-input="clear"]') ?? null,
    reveal,
    leadingAdornment: wrapper?.querySelector<HTMLElement>('.vf-input-wrap__icon--leading') ?? null,
    trailingAdornment: wrapper?.querySelector<HTMLElement>('.vf-input-wrap__icon--trailing') ?? null,
    revealLabels: {
      show: reveal?.getAttribute('aria-label') ?? 'Show password',
      hide: root.getAttribute('data-vf-razor-hide-password-label') ?? 'Hide password',
    },
  };
}

function findField(parts: InputParts): FieldParts | null {
  const root = parts.control.closest<HTMLElement>('[data-vf-razor-field]');
  const control = root?.querySelector<HTMLElement>('.vf-field__control') ?? null;

  if (!root || !control) {
    return null;
  }

  return { root, control, floating: root.getAttribute('data-vf-razor-field') === 'floating' };
}

function isBooleanAttributePresent(element: HTMLElement, name: string): boolean {
  return element.hasAttribute(name);
}

function toggleClass(element: HTMLElement | null, className: string, enabled: boolean): void {
  element?.classList.toggle(className, enabled);
}

/**
 * Shows or hides an action control.
 *
 * The server renders actions with `hidden` and an inline `display:none`,
 * because the canonical `.vf-icon-button` rule sets `display` and a class
 * selector outranks the user-agent `[hidden]` rule. Both have to be managed
 * together or the control stays visible while claiming to be hidden.
 */
function setActionAvailable(action: HTMLButtonElement, available: boolean): void {
  action.hidden = !available;
  action.disabled = !available;

  if (available) {
    action.style.removeProperty('display');
    // An emptied style attribute is still an attribute; the Vue output has
    // none, and leaving it behind would be a real difference.
    if (action.getAttribute('style') === '') {
      action.removeAttribute('style');
    }
  } else {
    action.style.display = 'none';
  }
}

/** Applies the derived state to the DOM. The rules decide; this only paints. */
function sync(parts: InputParts, revealed: boolean): void {
  const { control, wrapper } = parts;
  const filled = isInputFilled(control.value);
  const type = control.getAttribute('data-vf-razor-type') ?? undefined;
  const revealAvailable = isPasswordRevealAvailable({ passwordReveal: parts.reveal !== null, type });
  const clearAvailable = isClearActionAvailable({
    clearable: parts.clear !== null,
    filled,
    disabled: control.disabled,
    readonly: control.readOnly,
  });

  control.toggleAttribute('data-vf-filled', filled);
  if (filled) {
    control.setAttribute('data-vf-filled', 'true');
  }

  if (parts.clear) {
    setActionAvailable(parts.clear, clearAvailable);
  }

  if (parts.reveal) {
    setActionAvailable(parts.reveal, revealAvailable);
    parts.reveal.setAttribute('aria-pressed', revealed ? 'true' : 'false');
    parts.reveal.setAttribute('aria-label', revealed ? parts.revealLabels.hide : parts.revealLabels.show);

    const icon = getInputIcon(resolvePasswordRevealIcon(revealed));
    const svg = parts.reveal.querySelector('svg');
    if (svg) {
      svg.innerHTML = icon.body;
      // The button carries the accessible name; its glyph stays hidden.
      svg.setAttribute('aria-hidden', 'true');
    }
  }

  const state = resolveInputAdornmentState({
    hasLeadingAdornment: parts.leadingAdornment !== null,
    hasTrailingAdornment: parts.trailingAdornment !== null,
    hasPasswordRevealControl: revealAvailable,
    hasClearControl: clearAvailable,
  });

  toggleClass(control, 'vf-input--with-leading', state.hasLeadingAdornment);
  toggleClass(control, 'vf-input--with-trailing', state.hasTrailingControl);
  toggleClass(wrapper, 'vf-input-wrap--with-leading', state.hasLeadingAdornment);
  toggleClass(wrapper, 'vf-input-wrap--with-trailing', state.hasTrailingControl);
  toggleClass(
    wrapper,
    'vf-input-wrap--with-trailing-and-clear',
    state.hasTrailingAdornment && state.hasTrailingActionControl,
  );
  toggleClass(
    wrapper,
    'vf-input-wrap--with-trailing-password-and-clear',
    state.hasTrailingAdornment && revealAvailable && clearAvailable,
  );
  toggleClass(parts.trailingAdornment, 'vf-input-wrap__icon--trailing-before-clear', state.hasTrailingActionControl);
  toggleClass(parts.reveal, 'vf-input-wrap__password-toggle--before-clear', clearAvailable);

  // Field bridge: the filled and floating signals the static server markup
  // cannot maintain on its own.
  const field = findField(parts);
  if (field) {
    toggleClass(field.control, 'vf-field__control--filled', filled);
    toggleClass(field.root, 'vf-field--floating', field.floating);
    toggleClass(field.control, 'vf-field__control--floating', field.floating);
    toggleClass(control, 'vf-input--floating', field.floating);
    toggleClass(wrapper, 'vf-input-wrap--floating', field.floating);
  }
}

function readSelection(
  control: HTMLInputElement,
): { start: number; end: number; direction: 'forward' | 'backward' | 'none' } | null {
  if (control.selectionStart === null || control.selectionEnd === null) {
    return null;
  }

  return {
    start: control.selectionStart,
    end: control.selectionEnd,
    direction: control.selectionDirection ?? 'none',
  };
}

function enhanceRoot(root: HTMLElement): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) {
    return;
  }

  const parts = findParts(root);
  if (!parts) {
    return;
  }

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const { control } = parts;
  // The declared type is remembered before any reveal rewrites the live one.
  control.setAttribute('data-vf-razor-type', control.getAttribute('type') ?? '');
  let revealed = false;

  control.addEventListener('input', () => sync(parts, revealed));
  control.addEventListener('change', () => sync(parts, revealed));

  parts.clear?.addEventListener('mousedown', (event) => event.preventDefault());
  parts.clear?.addEventListener('click', () => {
    control.value = '';
    // Native events so a host's own listeners and any form framework see the
    // change exactly as if the user had cleared the field themselves.
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
    sync(parts, revealed);
    control.focus();
  });

  parts.reveal?.addEventListener('mousedown', (event) => event.preventDefault());
  parts.reveal?.addEventListener('click', () => {
    const selection = readSelection(control);
    revealed = !revealed;

    const declaredType = control.getAttribute('data-vf-razor-type') || undefined;
    const nextType = resolveInputType({
      type: declaredType,
      passwordRevealAvailable: isPasswordRevealAvailable({ passwordReveal: true, type: declaredType }),
      passwordRevealed: revealed,
    });

    if (nextType) {
      control.setAttribute('type', nextType);
    }

    sync(parts, revealed);
    control.focus();

    if (selection) {
      control.setSelectionRange(selection.start, selection.end, selection.direction);
    }
  });

  sync(parts, revealed);
}

/**
 * Enhances every Razor-owned input inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots.
 */
export function enhanceVueForgeInputs(root: ParentNode = document): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhanceVueForgeInputs());
  } else {
    enhanceVueForgeInputs();
  }
}
