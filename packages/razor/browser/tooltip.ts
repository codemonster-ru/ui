// Browser enhancement for the server-rendered VfTooltip.
//
// The third Razor overlay, and the first with no control of its own. What it
// reproduces is the reference's whole behaviour, which is small and exact:
//
//   - four listeners on the root and one timer. mouseenter and focusin clear
//     the timer and start a fresh one of `openDelay` milliseconds; when it
//     fires the tooltip opens. mouseleave and focusout clear the timer and
//     close at once. There is no hovered flag and no focused flag - the last
//     event wins, so a mouseleave closes a tooltip whose control still has
//     focus and a focusout closes one still under the pointer;
//   - opening writes aria-describedby on the trigger wrapper first, then - only
//     when the server deferred a body - renders a fresh span[role=tooltip]
//     from it with the arrow last, the last computed placement and position,
//     enter classes first and insertion second, and positions it with
//     floater.js a microtask later. With no deferred body the reference
//     renders nothing and its aria-describedby dangles; so does this;
//   - closing removes aria-describedby at once, stops autoUpdate and leaves
//     the tooltip in the DOM for the normal motion duration; reopening while
//     it leaves removes it at once and renders a new one;
//   - no key is handled, nothing is prevented, and there is no entry on the
//     escape stack: an Escape reaches whatever popover or dropdown is open;
//   - disposal (a popover closing around it) cancels the timer, stops
//     autoUpdate and removes the tooltip at once, without a leave.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker, and holds one
// tooltip per root - never one it finds by query. It dispatches no event: the
// reference emits none.
//
// The positioning and transition code has the same shape as popover.ts's and
// dropdown.ts's, and is written out here rather than shared: the reference's
// three SFCs share only useFloating and Vue's Transition, neither of which
// keeps state between instances.
import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import type { MiddlewareType, PlacementType } from '@codemonster-ru/floater.js';
import {
  TOOLTIP_FLIP_PLACEMENTS,
  TOOLTIP_OFFSET,
  TOOLTIP_OPEN_DELAY,
  TOOLTIP_STRATEGY,
  resolveTooltipArrowClasses,
  resolveTooltipArrowOffset,
  resolveTooltipContentClasses,
  resolveTooltipDescribedBy,
} from '@codemonster-ru/vueforge-shared-core';
import { vfMotionDurationsMs } from '@codemonster-ru/vueforge-theme';
import { disposeWithin, registerDisposal } from './disposal.js';

const ROOT_SELECTOR = '[data-vf-razor="tooltip"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-tooltip-enhanced';
const TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-tooltip="content"]';
const TRANSITION = 'vf-floating-transition';
const DURATION = vfMotionDurationsMs.normal;

// --------------------------------------------------------------- transition

/** Vue's nextFrame: the callback runs in the frame after the next one. */
function nextFrame(callback: () => void): number {
  let id = requestAnimationFrame(() => {
    id = requestAnimationFrame(callback);
  });
  return id;
}

/** One tooltip element and the transition classes it currently carries. */
interface LiveTooltip {
  element: HTMLElement;
  arrow: HTMLElement;
  transition: string[];
  timers: number[];
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

function setTransition(tooltip: LiveTooltip, base: string[], transition: string[]): void {
  tooltip.transition = transition;
  write(tooltip.element, 'className', [...base, ...transition].join(' '));
}

// ------------------------------------------------------------------ enhance

function enhanceRoot(root: HTMLElement, enhanceContent: (node: ParentNode) => void): void {
  if (root.hasAttribute(ENHANCED_ATTRIBUTE)) return;

  const found = root.querySelector<HTMLElement>(':scope > .vf-tooltip__trigger');
  if (!found) return;
  const trigger: HTMLElement = found;

  root.setAttribute(ENHANCED_ATTRIBUTE, '');

  // The pristine body, cloned into every tooltip this root opens; null when
  // the server deferred none, which is the reference's "no content".
  const template = root.querySelector<HTMLTemplateElement>(TEMPLATE_SELECTOR);
  const content = template ? template.content.cloneNode(true) : null;
  const tooltipId = root.getAttribute('data-vf-razor-tooltip-id') ?? '';
  const placement = root.getAttribute('data-vf-razor-tooltip-placement') ?? 'top';
  const delayAttribute = root.getAttribute('data-vf-razor-tooltip-open-delay');
  const openDelay = delayAttribute === null ? TOOLTIP_OPEN_DELAY : Number(delayAttribute);
  const teleport = root.getAttribute('data-vf-razor-tooltip-teleport') ?? 'body';
  const teleported = teleport !== 'false';
  const destination = teleported ? document.querySelector(teleport) : null;

  // Where this instance's tooltips are inserted: before an anchor appended to
  // the destination now, at bootstrap, in document order - where the
  // reference's Teleport puts its anchors at mount. An in-place tooltip goes
  // straight after the trigger, inside the root.
  const anchor = teleported && destination ? destination.appendChild(document.createTextNode('')) : null;

  // The values the reference keeps between opens: the next tooltip renders
  // the last computed placement and position before floater.js runs again.
  let x = 0;
  let y = 0;
  let currentPlacement = placement;
  let arrowData: Record<string, number> | undefined;
  let open = false;
  let timer: number | null = null;
  let live: LiveTooltip | null = null;
  let stopAutoUpdate: (() => void) | null = null;
  let run = 0;
  // Set once a host has unmounted this instance; nothing answers after it.
  let disposed = false;

  const baseClasses = () => resolveTooltipContentClasses(currentPlacement);

  function paint(tooltip: LiveTooltip): void {
    const offsetInTooltip = resolveTooltipArrowOffset(arrowData);

    setTransition(tooltip, baseClasses(), tooltip.transition);
    write(tooltip.element, 'left', `${x}px`);
    write(tooltip.element, 'top', `${y}px`);
    write(tooltip.arrow, 'className', resolveTooltipArrowClasses(currentPlacement).join(' '));
    write(tooltip.arrow, 'left', `${offsetInTooltip.x}px`);
    write(tooltip.arrow, 'top', `${offsetInTooltip.y}px`);
  }

  async function update(): Promise<void> {
    const tooltip = live;
    if (!tooltip || tooltip.phase === 'leaving') return;

    const result = await computePosition(trigger, tooltip.element, {
      placement: placement as PlacementType,
      middleware: [
        offset(TOOLTIP_OFFSET),
        flip({ placements: [...TOOLTIP_FLIP_PLACEMENTS] as PlacementType[] }),
        shift(),
        arrow(tooltip.arrow),
      ] as MiddlewareType[],
      strategy: TOOLTIP_STRATEGY,
    });

    x = result.x;
    y = result.y;
    currentPlacement = result.placement;
    arrowData = result.middlewareData?.arrow as Record<string, number> | undefined;
    if (live === tooltip && tooltip.phase !== 'leaving') paint(tooltip);
  }

  function stopPositioning(): void {
    run += 1;
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  }

  function startPositioning(): void {
    stopPositioning();
    const current = run;

    // A microtask, as the reference's nextTick is: after the tooltip is in the
    // DOM with its enter-from frame applied, before anything is painted.
    void Promise.resolve().then(async () => {
      if (current !== run || !open) return;
      await update();
      if (current !== run || !open || !live) return;
      stopAutoUpdate = autoUpdate(trigger, () => {
        void update();
      });
    });
  }

  function clearTransitionTimers(tooltip: LiveTooltip): void {
    for (const id of tooltip.timers) {
      cancelAnimationFrame(id);
      clearTimeout(id);
    }
    tooltip.timers = [];
  }

  function enter(tooltip: LiveTooltip): void {
    tooltip.phase = 'entering';
    setTransition(tooltip, baseClasses(), [`${TRANSITION}-enter-from`, `${TRANSITION}-enter-active`]);
    tooltip.timers.push(
      nextFrame(() => {
        if (tooltip.phase !== 'entering') return;
        setTransition(tooltip, baseClasses(), [`${TRANSITION}-enter-active`, `${TRANSITION}-enter-to`]);
        tooltip.timers.push(
          window.setTimeout(() => {
            if (tooltip.phase !== 'entering') return;
            tooltip.phase = 'open';
            setTransition(tooltip, baseClasses(), []);
          }, DURATION),
        );
      }),
    );
  }

  function leave(tooltip: LiveTooltip): void {
    clearTransitionTimers(tooltip);
    tooltip.phase = 'leaving';
    setTransition(tooltip, baseClasses(), [`${TRANSITION}-leave-from`]);
    // Vue forces a reflow between the two classes.
    void document.body.offsetHeight;
    setTransition(tooltip, baseClasses(), [`${TRANSITION}-leave-from`, `${TRANSITION}-leave-active`]);
    tooltip.timers.push(
      nextFrame(() => {
        // A reopen may already have removed this tooltip.
        if (!tooltip.element.isConnected) return;
        setTransition(tooltip, baseClasses(), [`${TRANSITION}-leave-active`, `${TRANSITION}-leave-to`]);
        tooltip.timers.push(
          window.setTimeout(() => {
            clearTransitionTimers(tooltip);
            tooltip.element.remove();
          }, DURATION),
        );
      }),
    );
  }

  function build(body: Node): LiveTooltip {
    const element = document.createElement('span');
    element.id = tooltipId;
    element.setAttribute('role', 'tooltip');
    const arrowElement = document.createElement('span');
    arrowElement.setAttribute('aria-hidden', 'true');
    element.append(body.cloneNode(true), arrowElement);
    const tooltip: LiveTooltip = { element, arrow: arrowElement, transition: [], timers: [], phase: 'entering' };
    paint(tooltip);
    return tooltip;
  }

  function place(element: HTMLElement): void {
    if (!teleported) {
      trigger.after(element);
    } else if (anchor) {
      anchor.before(element);
    }
  }

  function describe(): void {
    const describedBy = resolveTooltipDescribedBy(open, tooltipId);
    if (describedBy === undefined) trigger.removeAttribute('aria-describedby');
    else trigger.setAttribute('aria-describedby', describedBy);
  }

  function show(): void {
    if (open) return;
    open = true;
    describe();
    if (!content) return;

    // A tooltip still leaving is removed at once, as Vue's transition does
    // when the same element enters again.
    if (live && live.phase === 'leaving') {
      clearTransitionTimers(live);
      live.element.remove();
    }
    live = build(content);
    // The enter classes first and the insertion second, as Vue's before-enter
    // hook runs.
    enter(live);
    place(live.element);
    enhanceContent(live.element);
    startPositioning();
  }

  function hide(): void {
    if (!open) return;
    open = false;
    describe();
    stopPositioning();
    if (live) {
      // Vue unmounts what the tooltip holds as the leave begins; only the
      // tooltip element itself stays for the animation.
      disposeWithin(live.element);
      leave(live);
    }
  }

  function clearTimer(): void {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  // The reference's open(): a fresh timer, whatever was pending.
  function activate(): void {
    if (disposed) return;
    clearTimer();
    timer = window.setTimeout(() => {
      timer = null;
      show();
    }, openDelay);
  }

  // The reference's close(): no timer, and closed at once.
  function deactivate(): void {
    if (disposed) return;
    clearTimer();
    hide();
  }

  root.addEventListener('mouseenter', activate);
  root.addEventListener('mouseleave', deactivate);
  root.addEventListener('focusin', activate);
  root.addEventListener('focusout', deactivate);

  // What the reference's unmount does to a tooltip inside content a host
  // removes: the timer is cancelled, autoUpdate stops and an open tooltip goes
  // at once, without a leave.
  registerDisposal(root, () => {
    disposed = true;
    clearTimer();
    stopPositioning();
    if (live) {
      disposeWithin(live.element);
      clearTransitionTimers(live);
      live.element.remove();
      live = null;
    }
    anchor?.remove();
  });
}

/**
 * Enhances every Razor-owned tooltip inside `root`.
 *
 * Idempotent: a root is enhanced once. `enhanceContent` is called on each
 * freshly rendered tooltip so other Razor components inside its body mount as
 * they would on a fresh page.
 */
export function enhanceVueForgeTooltips(
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
