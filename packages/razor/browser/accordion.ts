// Browser enhancement for the server-rendered VfAccordion.
//
// The first Razor controller that owns a state change. The input controller
// paints derived state around a control the browser drives; this one *is* the
// driver, because the reference's trigger is a native button whose click and
// keydown the component handles itself, and whose panel it creates and
// destroys. What is reproduced, hook for hook:
//
//   - click toggles; Enter and Space toggle on keydown with preventDefault, so
//     no native click follows them - the historical handler, not native
//     activation. A disabled trigger toggles nothing;
//   - opening creates the panel from the server's deferred content, runs the
//     reference's enter: collapsed first, then measured height and full
//     opacity on the next frame, then every inline declaration cleared after
//     the theme's normal duration - which leaves an empty style attribute, as
//     the reference does;
//   - closing runs the reference's leave and removes the panel when the same
//     timer fires. Every open renders the content afresh, as v-if does;
//   - aria-expanded and the icon modifier flip at once, before the animation;
//   - each toggle dispatches one bubbling `vf-accordion:open-change` event on
//     the root with `{ open }`, the host's equivalent of update:open.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker; a Vue-rendered
// accordion on the same page is invisible to it, and a copied `.vf-accordion`
// class without the marker is too. Each root owns exactly its own trigger and
// panel - `:scope >` everywhere - so a nested accordion is its own root and a
// click on its trigger toggles it alone.
//
// There is no state object. The state is the server-rendered `aria-expanded`,
// read on every toggle: the server decides the initial state, the DOM carries
// it, and this file has no second copy to disagree with.
//
// Decisions the two adapters share come from @codemonster-ru/vueforge-shared-core;
// the duration comes from the theme package, exactly as the reference reads it.
import { resolveAccordionIconClasses, resolveAccordionTransition } from '@codemonster-ru/vueforge-shared-core';
import { vfMotionDurationsMs } from '@codemonster-ru/vueforge-theme';

const ROOT_SELECTOR = '[data-vf-razor="accordion"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-accordion-enhanced';
const CONTENT_TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-accordion="content"]';
const OPEN_CHANGE_EVENT = 'vf-accordion:open-change';

interface AccordionParts {
  root: HTMLElement;
  trigger: HTMLButtonElement;
  icon: HTMLElement | null;
  /** The default slot's markup, pristine, cloned into every panel this root opens. */
  content: DocumentFragment;
}

/** The panel currently in the root, whether settled, entering or leaving. */
interface LivePanel {
  element: HTMLElement;
  timer: number | null;
}

function findParts(root: HTMLElement): AccordionParts | null {
  const trigger = root.querySelector<HTMLButtonElement>(':scope > button.vf-accordion__trigger');
  if (!trigger) {
    return null;
  }

  const template = root.querySelector<HTMLTemplateElement>(CONTENT_TEMPLATE_SELECTOR);
  const panel = root.querySelector<HTMLElement>(':scope > .vf-accordion__content');
  const inner = panel?.querySelector<HTMLElement>(':scope > .vf-accordion__content-inner') ?? null;

  // The pristine content: the template's fragment for a closed render, a
  // clone of the inner wrapper's children for an open one. Either way what is
  // kept is the server's markup, so every later open renders the slot as the
  // server rendered it - the same freshness v-if gives a Vue consumer.
  const content = document.createDocumentFragment();
  if (template) {
    content.append(template.content.cloneNode(true));
  } else if (inner) {
    for (const child of inner.childNodes) content.append(child.cloneNode(true));
  }

  return {
    root,
    trigger,
    icon: trigger.querySelector<HTMLElement>(':scope > .vf-accordion__icon'),
    content,
  };
}

/** The reference's getContentHeight: the inner wrapper's offset height, or the panel's scroll height. */
function contentHeight(panel: HTMLElement): number {
  const inner = panel.firstElementChild as HTMLElement | null;
  return inner?.offsetHeight ?? panel.scrollHeight;
}

function clearInlineStyles(panel: HTMLElement): void {
  // Property by property, as the reference's after-enter does. The attribute
  // itself survives, empty - that is the historical output, and the parity
  // extractor already treats an empty style as absent.
  panel.style.height = '';
  panel.style.opacity = '';
  panel.style.overflow = '';
  panel.style.transition = '';
}

function enhanceRoot(root: HTMLElement, enhanceContent: (node: ParentNode) => void): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) {
    return;
  }

  const parts = findParts(root);
  if (!parts) {
    return;
  }

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const { trigger, icon, content } = parts;
  const transition = resolveAccordionTransition();
  const duration = vfMotionDurationsMs.normal;

  let live: LivePanel | null = (() => {
    const existing = root.querySelector<HTMLElement>(':scope > .vf-accordion__content');
    return existing ? { element: existing, timer: null } : null;
  })();

  const isOpen = (): boolean => trigger.getAttribute('aria-expanded') === 'true';

  const dropLivePanel = (): void => {
    if (!live) return;
    if (live.timer !== null) window.clearTimeout(live.timer);
    live.element.remove();
    live = null;
  };

  const open = (): void => {
    // A panel still leaving is removed at once, as Vue removes a cancelled
    // leave, and a fresh one enters.
    dropLivePanel();

    const panel = document.createElement('div');
    panel.id = trigger.getAttribute('aria-controls') ?? '';
    panel.setAttribute('aria-labelledby', trigger.id);
    panel.className = 'vf-accordion__content';
    panel.setAttribute('role', 'region');
    const inner = document.createElement('div');
    inner.className = 'vf-accordion__content-inner';
    inner.append(content.cloneNode(true));
    panel.append(inner);

    // before-enter, then insertion, then enter: the reference's order.
    panel.style.height = '0';
    panel.style.opacity = '0';
    panel.style.overflow = 'hidden';
    trigger.after(panel);
    // Anything Razor-rendered inside the slot mounts now, as a Vue child
    // component would on a fresh render.
    enhanceContent(panel);

    panel.style.transition = transition;
    window.requestAnimationFrame(() => {
      panel.style.height = `${contentHeight(panel)}px`;
      panel.style.opacity = '1';
    });

    const entering: LivePanel = { element: panel, timer: null };
    entering.timer = window.setTimeout(() => {
      entering.timer = null;
      clearInlineStyles(panel);
    }, duration);
    live = entering;
  };

  const close = (): void => {
    if (!live) return;
    const leaving = live;
    const panel = leaving.element;
    if (leaving.timer !== null) window.clearTimeout(leaving.timer);

    // before-leave, then leave, with the reflow between them.
    panel.style.height = `${contentHeight(panel)}px`;
    panel.style.opacity = '1';
    panel.style.overflow = 'hidden';
    panel.style.transition = transition;
    void panel.offsetHeight;
    panel.style.height = '0';
    panel.style.opacity = '0';

    leaving.timer = window.setTimeout(() => {
      leaving.timer = null;
      panel.remove();
      if (live === leaving) live = null;
    }, duration);
  };

  const setOpen = (next: boolean): void => {
    trigger.setAttribute('aria-expanded', next ? 'true' : 'false');
    if (icon) {
      icon.className = resolveAccordionIconClasses(next).join(' ');
    }
    if (next) {
      open();
    } else {
      close();
    }
    root.dispatchEvent(new CustomEvent(OPEN_CHANGE_EVENT, { bubbles: true, detail: { open: next } }));
  };

  const toggle = (): void => {
    // The reference's guard is on the prop; the native attribute is what the
    // server wrote for it, and a host may flip it later.
    if (trigger.disabled) return;
    setOpen(!isOpen());
  };

  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
}

/**
 * Enhances every Razor-owned accordion inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots. `enhanceContent` is called on each
 * freshly opened panel so other Razor components rendered inside the slot
 * mount as they would on a fresh page.
 */
export function enhanceVueForgeAccordions(
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
