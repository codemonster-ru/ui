// Browser enhancement for server-rendered vf-group-box components.
//
// The server renders the whole state; this controller reproduces the one
// behaviour a server cannot: the reference's `@click="toggle"` on the trigger.
// Nothing else. The reference has no keydown handler - Enter and Space reach it
// as the browser's native button activation, a click with keydown not
// prevented - so this controller adds none; it has no transition, so there is
// no timer and no animation frame; it has no document or window listener, so
// there is none here.
//
// What a toggle does is what the reference's re-render does:
//
//   - aria-expanded on the trigger and the root's collapsed modifier, the
//     modifier through the shared class rule so the canonical classes keep the
//     reference's order ahead of a consumer's;
//   - closing removes the content element outright, as v-if does;
//   - opening renders a fresh content element from the pristine default slot
//     markup - never the removed element - so nothing a user typed into it
//     survives a collapse, again as v-if does, and whatever the server
//     rendered inside is enhanced as on a fresh page.
//
// Ownership is explicit: only elements carrying `data-vf-razor="group-box"`
// are touched, the trigger is found strictly under that root's own legend, and
// a nested group box is its own root with its own controller.
import { resolveGroupBoxClasses, resolveGroupBoxFlags } from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="group-box"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-group-box-enhanced';
const TRIGGER_SELECTOR = ':scope > legend > button.vf-group-box__trigger';
const CONTENT_SELECTOR = ':scope > .vf-group-box__content';
const CONTENT_TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-group-box="content"]';
const COLLAPSED_CHANGE_EVENT = 'vf-group-box:collapsed-change';

// The canonical root classes, which a toggle rewrites; every other class on the
// root is the consumer's and is kept after them.
const CANONICAL_CLASSES = new Set(resolveGroupBoxClasses({ hasTitle: true, collapsible: true, collapsed: true }));

/**
 * Roots this controller has enhanced, held by identity rather than by the
 * marker attribute alone. Another component that re-renders its content from a
 * clone - an accordion panel, an outer group box - copies the marker along with
 * the markup, and a clone carrying the marker is a root nobody has enhanced.
 */
const enhanced = new WeakSet<HTMLElement>();

function pristineContent(root: HTMLElement): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const template = root.querySelector<HTMLTemplateElement>(CONTENT_TEMPLATE_SELECTOR);
  const live = root.querySelector<HTMLElement>(CONTENT_SELECTOR);

  if (template) {
    fragment.append(template.content.cloneNode(true));
  } else if (live) {
    for (const child of live.childNodes) fragment.append(child.cloneNode(true));
  }

  return fragment;
}

function enhanceRoot(root: HTMLElement, enhanceContent: (node: ParentNode) => void): void {
  if (enhanced.has(root)) {
    return;
  }

  const trigger = root.querySelector<HTMLButtonElement>(TRIGGER_SELECTOR);
  if (!trigger) {
    // A static group box - untitled, or titled and not collapsible. There is
    // nothing to enhance, and the root is not claimed.
    return;
  }

  enhanced.add(root);
  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const content = pristineContent(root);
  const isOpen = (): boolean => trigger.getAttribute('aria-expanded') === 'true';

  const setOpen = (open: boolean): void => {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.className = [
      ...resolveGroupBoxClasses({ hasTitle: true, collapsible: true, collapsed: !open }),
      ...[...root.classList].filter((name) => !CANONICAL_CLASSES.has(name)),
    ].join(' ');

    root.querySelector<HTMLElement>(CONTENT_SELECTOR)?.remove();

    if (open) {
      const panel = document.createElement('div');
      panel.id = trigger.getAttribute('aria-controls') ?? '';
      panel.setAttribute('aria-labelledby', trigger.id);
      panel.className = 'vf-group-box__content';
      panel.setAttribute('role', 'region');
      panel.append(content.cloneNode(true));
      trigger.closest('legend')?.after(panel);
      enhanceContent(panel);
    }

    root.dispatchEvent(new CustomEvent(COLLAPSED_CHANGE_EVENT, { bubbles: true, detail: { collapsed: !open } }));
  };

  trigger.addEventListener('click', () => {
    // The reference's guard, through the shared rule. A natively disabled
    // trigger never receives the click, so in a browser this can only matter
    // if something dispatches one by hand.
    const flags = resolveGroupBoxFlags({
      hasTitle: true,
      collapsible: true,
      open: isOpen(),
      disabled: trigger.disabled,
    });
    if (!flags.toggleable) return;

    setOpen(!isOpen());
  });
}

/**
 * Enhances every Razor-owned group box inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots. `enhanceContent` is called on each
 * freshly rendered content element so other Razor components rendered inside
 * the default slot - a nested group box included - mount as they would on a
 * fresh page.
 */
export function enhanceVueForgeGroupBoxes(
  root: ParentNode = document,
  enhanceContent: (node: ParentNode) => void = () => {},
): void {
  const roots =
    root instanceof Element && root.matches(ROOT_SELECTOR)
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>(ROOT_SELECTOR));

  for (const element of roots) {
    enhanceRoot(element, enhanceContent);
  }
}
