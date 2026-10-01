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
  getIcon,
  isClearActionAvailable,
  isInputFilled,
  isPasswordRevealAvailable,
  resolveInputAdornmentState,
  resolveInputType,
  resolvePasswordRevealIcon,
} from '@codemonster-ru/vueforge-shared-core';

import { enhanceVueForgeFields } from './field.js';
import { enhanceVueForgeTextareas } from './textarea.js';
import { enhanceVueForgeCheckables } from './checkable.js';
import { enhanceVueForgeAccordions } from './accordion.js';
import { enhanceVueForgeSteppers } from './stepper.js';
import { enhanceVueForgeTabs } from './tabs.js';
import { enhanceVueForgeDropdowns } from './dropdown.js';
import { enhanceVueForgeGroupBoxes } from './group-box.js';
import { enhanceVueForgePopovers } from './popover.js';
import { enhanceVueForgeTooltips } from './tooltip.js';
import { enhanceVueForgeSelects } from './select.js';
import { enhanceVueForgeNavMenus } from './nav-menu.js';

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

    const icon = getIcon(resolvePasswordRevealIcon(revealed));
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

  // Nothing here writes field DOM. vf-field owns its own classes, and the
  // floating modifiers on this control are rendered by the server, which knows
  // the placement. See browser/field.ts for why the ownership is split.
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

/** Enhances every Razor-owned component, each owning only its own subtree. */
function enhanceAll(root: ParentNode = document): void {
  // Group boxes first: a group box reads its pristine content when it is
  // enhanced, and an open group box's content must be read before any other
  // controller has enhanced - and possibly rewritten - what is inside it. It
  // is handed this same function so that whatever the server rendered inside
  // its content mounts each time a fresh content element is rendered.
  enhanceVueForgeGroupBoxes(root, enhanceAll);
  // Popovers next, for the same reason: an initially open popover reads its
  // pristine content when it is enhanced, before the dropdowns or anything
  // else inside it are. It is handed this function so that whatever its
  // content holds mounts in every fresh panel.
  enhanceVueForgePopovers(root, enhanceAll);
  // Tooltips after the popovers: a tooltip inside a closed popover waits in
  // the popover's inert template and mounts with each fresh panel. It reads
  // its own pristine body when it is enhanced, and is handed this function so
  // that whatever that body holds mounts in every fresh tooltip.
  enhanceVueForgeTooltips(root, enhanceAll);
  enhanceVueForgeInputs(root);
  // Textareas before fields: the field reads the control's current value when
  // it attaches, and the textarea's own marker should already be correct.
  enhanceVueForgeTextareas(root);
  enhanceVueForgeFields(root);
  enhanceVueForgeCheckables(root);
  // The accordion is handed this same function so that whatever the server
  // rendered inside a closed panel - an input, a field, another accordion -
  // mounts when the panel opens, as a fresh render would mount it.
  enhanceVueForgeAccordions(root, enhanceAll);
  enhanceVueForgeSteppers(root);
  // The tabs are handed this same function for the same reason: whatever the
  // server rendered into a panel's template mounts when that panel is shown.
  enhanceVueForgeTabs(root, enhanceAll);
  // The dropdown is handed this same function so that whatever the server
  // rendered into its menu mounts each time a fresh menu is rendered.
  enhanceVueForgeDropdowns(root, enhanceAll);
  // Selects render nothing another controller mounts - their options are the
  // adapter's own buttons - so they take no enhanceContent. A select inside a
  // popover waits in the popover's template and mounts with each fresh panel.
  enhanceVueForgeSelects(root);
  // Nav menus render nothing another controller mounts - their items are
  // data, not slots - so they take no enhanceContent. A nav menu inside a
  // popover or a closed accordion waits in that host's template and mounts
  // with each fresh panel.
  enhanceVueForgeNavMenus(root);
}

export {
  enhanceVueForgeAccordions,
  enhanceVueForgeCheckables,
  enhanceVueForgeDropdowns,
  enhanceVueForgeFields,
  enhanceVueForgeGroupBoxes,
  enhanceVueForgeNavMenus,
  enhanceVueForgePopovers,
  enhanceVueForgeSelects,
  enhanceVueForgeSteppers,
  enhanceVueForgeTabs,
  enhanceVueForgeTextareas,
  enhanceVueForgeTooltips,
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhanceAll());
  } else {
    enhanceAll();
  }
}
