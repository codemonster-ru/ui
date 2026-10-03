// Browser enhancement for the server-rendered VfPopover.
//
// The second Razor overlay. It owns a trigger wrapper and a
// `section[role=dialog]` it creates on open, moves out of its root, positions
// with floater.js, animates in and out, and destroys on close - as
// dropdown.ts does for its menu. What differs is exactly where the reference's
// VfPopover differs from its VfDropdown, in the order the reference runs it:
//
//   - a click on the trigger toggles it, and so do Enter and Space - an open
//     popover closes. ArrowDown opens, and opens again, notifying again, when
//     it is already open. All three are prevented; every other key is left
//     alone. There is no disabled state;
//   - opening notifies, then renders a fresh panel from the server's pristine
//     content with the last computed placement and position, enter classes
//     first and insertion second; a microtask later focus moves into it - to
//     the first `[autofocus], [data-autofocus]` in document order, or the
//     panel itself - and then floater.js positions it and autoUpdate starts;
//   - every close this controller makes notifies and focuses the trigger:
//     a trigger click, Enter, Space, Escape and an outside click. Whatever the
//     closing panel holds is unmounted at once (disposal.ts) - a dropdown open
//     inside it loses its menu and its escape entry - and the panel leaves
//     over the normal motion duration;
//   - a click inside the panel does nothing. A document click outside the
//     trigger and the panel closes it when closeOnOutsideClick is on; one
//     listener per instance, registered at bootstrap in document order;
//   - Escape is the page-wide stack in escape-stack.ts, the one every
//     dropdown is on. The entry is there whenever the popover is open; with
//     closeOnEscape off it takes the Escape and does nothing - no prevent, and
//     no entry below sees it.
//
// Every open and close dispatches one bubbling `vf-popover:open-change` on the
// root with `{ open }`, the host's equivalent of update:open and openChange.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker, and holds one
// panel per root - never one it finds by query. There is no floating runtime
// beyond the calls the reference makes, and no stack of its own.
//
// The positioning and transition code has the same shape as dropdown.ts's,
// and is written out here rather than shared: the reference's two SFCs share
// only useFloating and Vue's Transition, neither of which keeps state between
// instances, so two copies cannot disagree about anything but their own
// panel. The escape stack is different - it is one piece of state for the
// whole page - and it is the one thing the two controllers share.
import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import type { MiddlewareType, PlacementType } from '@codemonster-ru/floater.js';
import {
  POPOVER_AUTOFOCUS_SELECTOR,
  POPOVER_OFFSET,
  POPOVER_STRATEGY,
  resolvePopoverArrowClasses,
  resolvePopoverArrowOffset,
  resolvePopoverClosesOnEscape,
  resolvePopoverClosesOnOutsideClick,
  resolvePopoverContentClasses,
  resolvePopoverFlipPlacements,
  resolvePopoverTriggerKey,
} from '@codemonster-ru/vueforge-shared-core';
import { vfMotionDurationsMs } from '@codemonster-ru/vueforge-theme';
import { disposeWithin, registerDisposal } from './disposal.js';
import { activateEscapeEntry, removeEscapeEntry } from './escape-stack.js';

const ROOT_SELECTOR = '[data-vf-razor="popover"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-popover-enhanced';
const TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-popover="content"]';
const OPEN_CHANGE_EVENT = 'vf-popover:open-change';
const TRANSITION = 'vf-floating-transition';
const DURATION = vfMotionDurationsMs.normal;

// --------------------------------------------------------------- transition

/** Vue's nextFrame: the callback runs in the frame after the next one. Both frames are recorded. */
function nextFrame(panel: LivePanel, callback: () => void): void {
  panel.frames.push(
    requestAnimationFrame(() => {
      panel.frames.push(requestAnimationFrame(callback));
    }),
  );
}

/** One panel element and the transition classes it currently carries. */
interface LivePanel {
  element: HTMLElement;
  arrow: HTMLElement;
  transition: string[];
  // Animation frames and timeouts are two id spaces: a frame id handed to
  // clearTimeout cancels whichever unrelated timer of the page happens to
  // share the number, and a timeout id handed to cancelAnimationFrame
  // whichever frame does. Kept apart since M33.1, as the select keeps them.
  frames: number[];
  timeouts: number[];
  phase: 'entering' | 'open' | 'leaving';
}

/** Writes a property only when it changes, as Vue's patch does. */
function write(element: HTMLElement, property: 'className' | 'left' | 'top', value: string): void {
  if (property === 'className') {
    if (element.className !== value) element.className = value;
  } else if (element.style[property] !== value) {
    element.style[property] = value;
  }
}

function setTransition(panel: LivePanel, base: string[], transition: string[]): void {
  panel.transition = transition;
  write(panel.element, 'className', [...base, ...transition].join(' '));
}

// ------------------------------------------------------------------ enhance

interface PopoverParts {
  root: HTMLElement;
  trigger: HTMLElement;
  /** The default slot's markup, pristine, cloned into every panel this root opens. */
  content: DocumentFragment;
  /** A panel the server rendered open, still in place. */
  serverPanel: HTMLElement | null;
  placement: string;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  /** Where the panel goes: an element, or null for in place. */
  destination: Element | null;
  teleported: boolean;
}

function findParts(root: HTMLElement): PopoverParts | null {
  const trigger = root.querySelector<HTMLElement>(':scope > .vf-popover__trigger');
  if (!trigger) return null;

  const template = root.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR);
  const serverPanel = root.querySelector<HTMLElement>(':scope > .vf-popover__content');
  const content = document.createDocumentFragment();

  // The pristine content: the template's fragment for a closed render, a
  // clone of what follows the arrow for an open one - read before any other
  // controller has enhanced it, which is why popovers are enhanced early.
  if (template) {
    content.append(template.content.cloneNode(true));
  } else if (serverPanel) {
    for (const child of [...serverPanel.childNodes].slice(1)) content.append(child.cloneNode(true));
  }

  const teleport = root.getAttribute('data-vf-razor-popover-teleport') ?? 'body';
  const teleported = teleport !== 'false';

  return {
    root,
    trigger,
    content,
    serverPanel,
    placement: root.getAttribute('data-vf-razor-popover-placement') ?? 'bottom-start',
    closeOnOutsideClick: root.getAttribute('data-vf-razor-popover-close-on-outside-click') !== 'false',
    closeOnEscape: root.getAttribute('data-vf-razor-popover-close-on-escape') !== 'false',
    destination: teleported ? document.querySelector(teleport) : null,
    teleported,
  };
}

function enhanceRoot(root: HTMLElement, enhanceContent: (node: ParentNode) => void): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) return;

  const parts = findParts(root);
  if (!parts) return;

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  const { trigger, content, placement, closeOnOutsideClick, closeOnEscape, destination, teleported } = parts;
  const contentId = trigger.getAttribute('aria-controls') ?? '';

  // Where this instance's panels are inserted: before an anchor appended to
  // the destination now, at bootstrap, in document order - where the
  // reference's Teleport puts its anchors at mount. An in-place panel goes
  // straight after the trigger.
  const anchor = teleported && destination ? destination.appendChild(document.createTextNode('')) : null;

  // The values the reference keeps between opens: the next panel renders the
  // last computed placement and position before floater.js runs again.
  let x = 0;
  let y = 0;
  let currentPlacement = placement;
  let arrowData: Record<string, number> | undefined;
  let live: LivePanel | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let run = 0;
  // Set once a host has unmounted this instance; nothing answers after it.
  let disposed = false;

  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const panelClasses = () => resolvePopoverContentClasses(currentPlacement);

  function notify(open: boolean): void {
    root.dispatchEvent(new CustomEvent(OPEN_CHANGE_EVENT, { bubbles: true, detail: { open } }));
  }

  function paint(panel: LivePanel): void {
    const offsetInPanel = resolvePopoverArrowOffset(arrowData);

    setTransition(panel, panelClasses(), panel.transition);
    write(panel.element, 'left', `${x}px`);
    write(panel.element, 'top', `${y}px`);
    write(panel.arrow, 'className', resolvePopoverArrowClasses(currentPlacement).join(' '));
    write(panel.arrow, 'left', `${offsetInPanel.x}px`);
    write(panel.arrow, 'top', `${offsetInPanel.y}px`);
  }

  async function update(): Promise<void> {
    const panel = live;
    if (!panel || panel.phase === 'leaving') return;

    const result = await computePosition(trigger, panel.element, {
      placement: placement as PlacementType,
      middleware: [
        offset(POPOVER_OFFSET),
        flip({ placements: resolvePopoverFlipPlacements(placement) as PlacementType[] }),
        shift(),
        arrow(panel.arrow),
      ] as MiddlewareType[],
      strategy: POPOVER_STRATEGY,
    });

    x = result.x;
    y = result.y;
    currentPlacement = result.placement;
    arrowData = result.middlewareData?.arrow as Record<string, number> | undefined;
    if (live === panel && panel.phase !== 'leaving') paint(panel);
  }

  function stopPositioning(): void {
    run += 1;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  }

  function startPositioning(): void {
    stopPositioning();
    const current = run;

    // A microtask, as the reference's nextTick is: after the panel is in the
    // DOM with its enter-from frame applied, before anything is painted.
    void Promise.resolve().then(async () => {
      if (current !== run || !isOpen()) return;
      await update();
      if (current !== run || !isOpen() || !live) return;
      stopAutoUpdate = autoUpdate(trigger, () => {
        void update();
      });
    });
  }

  function enter(panel: LivePanel): void {
    panel.phase = 'entering';
    setTransition(panel, panelClasses(), [`${TRANSITION}-enter-from`, `${TRANSITION}-enter-active`]);
    nextFrame(panel, () => {
      if (panel.phase !== 'entering') return;
      setTransition(panel, panelClasses(), [`${TRANSITION}-enter-active`, `${TRANSITION}-enter-to`]);
      panel.timeouts.push(
        window.setTimeout(() => {
          if (panel.phase !== 'entering') return;
          panel.phase = 'open';
          setTransition(panel, panelClasses(), []);
        }, DURATION),
      );
    });
  }

  function clearTimers(panel: LivePanel): void {
    for (const id of panel.frames) cancelAnimationFrame(id);
    for (const id of panel.timeouts) clearTimeout(id);
    panel.frames = [];
    panel.timeouts = [];
  }

  function leave(panel: LivePanel): void {
    clearTimers(panel);
    panel.phase = 'leaving';
    setTransition(panel, panelClasses(), [`${TRANSITION}-leave-from`]);
    // Vue forces a reflow between the two classes.
    void document.body.offsetHeight;
    setTransition(panel, panelClasses(), [`${TRANSITION}-leave-from`, `${TRANSITION}-leave-active`]);
    nextFrame(panel, () => {
      // A reopen may already have removed this panel.
      if (!panel.element.isConnected) return;
      setTransition(panel, panelClasses(), [`${TRANSITION}-leave-active`, `${TRANSITION}-leave-to`]);
      panel.timeouts.push(
        window.setTimeout(() => {
          clearTimers(panel);
          panel.element.remove();
        }, DURATION),
      );
    });
  }

  function buildPanel(): LivePanel {
    const element = document.createElement('section');
    element.id = contentId;
    element.setAttribute('aria-labelledby', trigger.id);
    element.setAttribute('role', 'dialog');
    element.setAttribute('tabindex', '-1');
    const arrowElement = document.createElement('span');
    arrowElement.setAttribute('aria-hidden', 'true');
    element.append(arrowElement, content.cloneNode(true));
    const panel: LivePanel = {
      element,
      arrow: arrowElement,
      transition: [],
      frames: [],
      timeouts: [],
      phase: 'entering',
    };
    paint(panel);
    return panel;
  }

  function place(element: HTMLElement): void {
    if (!teleported) {
      trigger.after(element);
    } else if (anchor) {
      anchor.before(element);
    }
  }

  /** The reference's focusContent: the first autofocus target, or the panel. */
  function focusContent(): void {
    const panel = live;
    if (!panel || panel.phase === 'leaving') return;
    (panel.element.querySelector<HTMLElement>(POPOVER_AUTOFOCUS_SELECTOR) ?? panel.element).focus();
  }

  function open(): void {
    const wasOpen = isOpen();
    if (!wasOpen) activateEscapeEntry(onEscape);
    notify(true);

    if (!wasOpen) {
      // A panel still leaving is removed at once, as Vue's transition does
      // when the same element enters again.
      if (live && live.phase === 'leaving') {
        clearTimers(live);
        live.element.remove();
      }
      trigger.setAttribute('aria-expanded', 'true');
      live = buildPanel();
      // The enter classes first and the insertion second, as Vue's
      // before-enter hook runs.
      enter(live);
      place(live.element);
      enhanceContent(live.element);
    }

    // Focus is queued before the position, which is the order the reference's
    // two continuations resume in after its render - and on every open,
    // including one that finds the popover already open.
    void Promise.resolve().then(focusContent);
    if (!wasOpen) startPositioning();
  }

  function close(): void {
    const wasOpen = isOpen();
    if (wasOpen) removeEscapeEntry(onEscape);
    notify(false);
    trigger.focus();

    if (!wasOpen) return;

    trigger.setAttribute('aria-expanded', 'false');
    stopPositioning();
    if (live) {
      // Vue unmounts what the panel holds as the leave begins; only the
      // panel element itself stays for the animation.
      disposeWithin(live.element);
      leave(live);
    }
  }

  function toggle(): void {
    if (isOpen()) close();
    else open();
  }

  function onEscape(event: KeyboardEvent): void {
    if (!resolvePopoverClosesOnEscape(isOpen(), closeOnEscape)) return;
    event.preventDefault();
    close();
  }

  trigger.addEventListener('click', () => {
    if (disposed) return;
    toggle();
  });

  trigger.addEventListener('keydown', (event) => {
    if (disposed) return;
    const action = resolvePopoverTriggerKey(event.key);
    if (!action) return;
    event.preventDefault();
    if (action === 'toggle') toggle();
    else open();
  });

  // One outside listener per instance, for the life of the page, gated by the
  // open state - the reference's useClickOutside with event 'click'. A
  // leaving panel is no longer the reference's content ref.
  document.addEventListener('click', (event) => {
    if (disposed || !resolvePopoverClosesOnOutsideClick(isOpen(), closeOnOutsideClick)) return;
    const node = event.target;
    if (!(node instanceof Node)) return;
    if (trigger.contains(node) || (live && live.phase !== 'leaving' && live.element.contains(node))) return;
    close();
  });

  // What the reference's unmount does to a popover inside content a host
  // removes: what its panel holds is unmounted first, a teleported panel goes
  // at once without a leave, the entry leaves the escape stack and autoUpdate
  // stops. No notification and no focus move.
  registerDisposal(root, () => {
    disposed = true;
    removeEscapeEntry(onEscape);
    stopPositioning();
    if (live) {
      disposeWithin(live.element);
      clearTimers(live);
      if (teleported) live.element.remove();
      live = null;
    }
    anchor?.remove();
  });

  // A panel the server rendered open is replaced by a fresh one at its
  // destination, entered as the reference's appear transition enters it,
  // positioned, and put on the escape stack - without a notification and
  // without a focus move, as the reference does for its initial state.
  if (isOpen()) {
    parts.serverPanel?.remove();
    activateEscapeEntry(onEscape);
    live = buildPanel();
    enter(live);
    place(live.element);
    enhanceContent(live.element);
    startPositioning();
  }
}

/**
 * Enhances every Razor-owned popover inside `root`.
 *
 * Idempotent: a root is enhanced once. `enhanceContent` is called on each
 * freshly rendered panel so other Razor components inside the slot mount as
 * they would on a fresh page.
 */
export function enhanceVueForgePopovers(
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
