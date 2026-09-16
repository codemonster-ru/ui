// Browser enhancement for the server-rendered VfTabs.
//
// The third Razor controller that owns a state change, and the widest so far:
// it owns N native buttons carrying an explicit `tab` role and a roving
// tabindex, two more native buttons the internal horizontal scroller owns,
// one panel it patches or creates, an indicator it measures off the DOM, an
// overflow state it reads off the viewport, two fades, a 140 ms scrolling
// timer, two frames of readiness, a ResizeObserver and a resize listener.
// What is reproduced, handler for handler, in the order the reference runs
// them:
//
//   - a click on an enabled tab selects it - the current one included, which
//     notifies again. Enter and Space are *not* handled: the tab is a native
//     button, the browser synthesises the click, and the click handler is the
//     only activation path;
//   - ArrowRight/ArrowLeft *and* ArrowDown/ArrowUp, Home and End are handled
//     on keydown with preventDefault, relative to the tab that received the
//     key among the enabled items, wrapping, RTL read from closest('[dir]')
//     and, past a shadow boundary, from the document element - never from
//     the computed style. The target is both selected and focused, through
//     this root's own tabs;
//   - selecting rewrites aria-selected and tabindex on every tab through the
//     shared projection (so a duplicated value is selected twice and an
//     unknown one nowhere), patches the one panel in place - its id from the
//     tab's aria-controls, its aria-labelledby from the tab's id, its content
//     from the server's inert template for that item - or creates it when
//     none exists, re-measures the indicator, re-reads the scroll state, and
//     dispatches one bubbling `vf-tabs:change` on the root with `{ value }`,
//     the host's equivalent of the reference's update:modelValue + change;
//   - the scroller: the two buttons are hidden - class, aria-hidden,
//     tabindex -1, disabled - until the first frame and whenever that
//     direction cannot scroll; the fades exist only after the second frame
//     and while that direction can scroll; a click scrolls by the shared
//     step, smoothly unless reduced motion is requested; every scroll marks
//     140 ms of scrolling on the viewport's scrollbar-width variable and the
//     indicator's no-transition class; the state is re-read on scroll, on
//     resize and through a ResizeObserver on the viewport;
//   - the indicator: three inline declarations from the shared geometry rule,
//     fed the viewport rect, the active tab rect, the viewport's clientWidth
//     and the offsetWidth of whichever button is currently shown; the ready
//     class one frame after mount.
//
// Scope is deliberate and narrow. The controller mounts only roots the Razor
// adapter rendered, found by their explicit ownership marker; a Vue-rendered
// tabs on the same page is invisible to it, and a copied `.vf-tabs` class
// without the marker is too. Each root owns exactly its own tabs, buttons,
// viewport, indicator and panel - `:scope >` everywhere, focus through its
// own list - so two roots sharing values never see each other.
//
// There is no state object. The selection is whichever tab carries
// aria-selected="true", read on every gesture; the items are the tabs in
// document order with their value from the adapter's own marker and their
// native disabled attribute. The server decides the initial state, the DOM
// carries it, and this file has no second copy to disagree with - except
// the scroller's five booleans, which are what the reference holds in refs
// and which nothing but this controller reads.
//
// Decisions the two adapters share come from @codemonster-ru/vueforge-shared-core.
import {
  isTabsItemSelected,
  resolveTabsIndicatorStyle,
  resolveTabsNavigationTarget,
  resolveTabsScrollerState,
  resolveTabsScrollerStep,
  resolveTabsTabIndex,
} from '@codemonster-ru/vueforge-shared-core';

const ROOT_SELECTOR = '[data-vf-razor="tabs"]';
const ENHANCED_ATTRIBUTE = 'data-vf-razor-tabs-enhanced';
const VALUE_ATTRIBUTE = 'data-vf-razor-tabs-value';
const PANEL_TEMPLATE_SELECTOR = ':scope > template[data-vf-razor-tabs-panel]';
const CHANGE_EVENT = 'vf-tabs:change';
const SCROLL_STOP_MS = 140;
const STEP_RATIO = 0.6;
const MIN_STEP = 120;

interface TabsParts {
  root: HTMLElement;
  scroller: HTMLElement;
  viewport: HTMLElement;
  tablist: HTMLElement;
  left: HTMLButtonElement;
  right: HTMLButtonElement;
  indicator: HTMLElement;
  /** The server's inert panel content, one fragment per item index; empty without a panel slot. */
  templates: HTMLTemplateElement[];
}

interface Tab {
  button: HTMLButtonElement;
  value: string;
  disabled: boolean;
}

/** The tabs as the DOM holds them now: one per tab button, in order. */
function readTabs(tablist: HTMLElement): Tab[] {
  return [...tablist.querySelectorAll<HTMLButtonElement>(':scope > button.vf-tabs__tab')].map((button) => ({
    button,
    value: button.getAttribute(VALUE_ATTRIBUTE) ?? '',
    disabled: button.disabled,
  }));
}

function findParts(root: HTMLElement): TabsParts | null {
  const scroller = root.querySelector<HTMLElement>(':scope > .vf-tabs__list');
  const viewport = scroller?.querySelector<HTMLElement>(':scope > .vf-tabs__list-scroller') ?? null;
  const tablist = viewport?.querySelector<HTMLElement>(':scope > [role="tablist"]') ?? null;
  const left = scroller?.querySelector<HTMLButtonElement>(':scope > .vf-tabs__scroll-button--left') ?? null;
  const right = scroller?.querySelector<HTMLButtonElement>(':scope > .vf-tabs__scroll-button--right') ?? null;
  const indicator = scroller?.querySelector<HTMLElement>(':scope > .vf-tabs__indicator') ?? null;

  if (!scroller || !viewport || !tablist || !left || !right || !indicator) {
    return null;
  }

  return {
    root,
    scroller,
    viewport,
    tablist,
    left,
    right,
    indicator,
    templates: [...root.querySelectorAll<HTMLTemplateElement>(PANEL_TEMPLATE_SELECTOR)],
  };
}

/** The reference's direction lookup for the keyboard: the nearest dir, else the document's past a shadow root. */
function keyboardIsRtl(target: Element): boolean {
  const directionHost = target.closest('[dir]');
  return (
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' ||
    (!directionHost && document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl')
  );
}

/** The scroller's direction lookup: the nearest dir, else the computed style. */
function scrollerIsRtl(viewport: HTMLElement): boolean {
  const directionHost = viewport.closest('[dir]');
  return (
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' || window.getComputedStyle(viewport).direction === 'rtl'
  );
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

  const { scroller, viewport, tablist, left, right, indicator, templates } = parts;
  const hasPanelSlot = templates.length > 0;

  // The scroller's state, as the reference holds it in refs.
  let canScrollLeft = false;
  let canScrollRight = false;
  let controlsReady = false;
  let controlsAnimated = false;
  let isScrolling = false;
  let scrollStopTimeout: number | null = null;

  const activeValue = (): string | undefined =>
    readTabs(tablist).find((tab) => tab.button.getAttribute('aria-selected') === 'true')?.value;

  const activeTab = (): Tab | undefined => {
    const value = activeValue();
    return value === undefined ? undefined : readTabs(tablist).find((tab) => tab.value === value);
  };

  /** Paints one scroll control's shown or hidden state, all four halves together. */
  const paintControl = (button: HTMLButtonElement, canScroll: boolean): void => {
    const hidden = !controlsReady || !canScroll;
    button.classList.toggle('vf-horizontal-scroller__control--hidden', hidden);
    button.classList.toggle('vf-tabs__scroll-button--hidden', hidden);
    button.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    button.setAttribute('tabindex', hidden ? '-1' : '0');
    button.disabled = hidden;
  };

  /** Creates or removes one fade: rendered only while animated and scrollable that way, as under v-if. */
  const paintFade = (side: 'left' | 'right', shown: boolean): void => {
    const existing = scroller.querySelector<HTMLElement>(`:scope > .vf-horizontal-scroller__fade--${side}`);
    if (shown && !existing) {
      const fade = document.createElement('div');
      fade.className = `vf-horizontal-scroller__fade vf-horizontal-scroller__fade--${side}`;
      fade.setAttribute('aria-hidden', 'true');
      // The reference's order: viewport, left fade, right fade, right button.
      const anchor =
        side === 'left' ? (scroller.querySelector(':scope > .vf-horizontal-scroller__fade--right') ?? right) : right;
      scroller.insertBefore(fade, anchor);
    } else if (!shown && existing) {
      existing.remove();
    }
  };

  const paintScroller = (): void => {
    for (const [name, on] of [
      ['vf-horizontal-scroller--controls-ready', controlsReady],
      ['vf-horizontal-scroller--controls-animated', controlsAnimated],
      ['vf-horizontal-scroller--can-scroll-left', canScrollLeft],
      ['vf-horizontal-scroller--can-scroll-right', canScrollRight],
      ['vf-tabs__list--can-scroll-left', canScrollLeft],
      ['vf-tabs__list--can-scroll-right', canScrollRight],
      ['vf-tabs--scroll-controls-ready', controlsReady],
      ['vf-tabs--scroll-controls-animated', controlsAnimated],
    ] as const) {
      scroller.classList.toggle(name, on);
    }
    root.classList.toggle('vf-tabs--scroll-controls-ready', controlsReady);
    root.classList.toggle('vf-tabs--scroll-controls-animated', controlsAnimated);
    paintControl(left, canScrollLeft);
    paintControl(right, canScrollRight);
    paintFade('left', controlsAnimated && canScrollLeft);
    paintFade('right', controlsAnimated && canScrollRight);
    viewport.style.setProperty('--vf-horizontal-scroller-scrollbar-width', isScrolling ? 'thin' : 'none');
    indicator.classList.toggle('vf-tabs__indicator--no-transition', isScrolling);
  };

  const updateScrollState = (): void => {
    const state = resolveTabsScrollerState({
      scrollWidth: viewport.scrollWidth,
      clientWidth: viewport.clientWidth,
      scrollLeft: viewport.scrollLeft,
      isRtl: scrollerIsRtl(viewport),
    });
    canScrollLeft = state.canScrollLeft;
    canScrollRight = state.canScrollRight;
    paintScroller();
  };

  const updateIndicator = (): void => {
    const tab = activeTab();
    const declarations = tab
      ? resolveTabsIndicatorStyle({
          listLeft: viewport.getBoundingClientRect().left,
          listClientWidth: viewport.clientWidth,
          tabLeft: tab.button.getBoundingClientRect().left,
          tabWidth: tab.button.getBoundingClientRect().width,
          // The shown button's width is the inset; a button the state hides
          // is not consulted, exactly as the reference queries it only
          // while that direction can scroll.
          insetStart: canScrollLeft ? left.offsetWidth : 0,
          insetEnd: canScrollRight ? right.offsetWidth : 0,
        })
      : resolveTabsIndicatorStyle(null);
    for (const [property, value] of declarations) {
      indicator.style.setProperty(property, value);
    }
    updateScrollState();
  };

  /** The one panel, patched in place as the reference's v-if branch is, or created when the value had none. */
  const paintPanel = (tabs: Tab[], value: string): void => {
    if (!hasPanelSlot) return;
    const index = tabs.findIndex((tab) => tab.value === value);
    const existing = root.querySelector<HTMLElement>(':scope > .vf-tabs__panel');
    if (index === -1) {
      existing?.remove();
      return;
    }
    const tab = tabs[index]!;
    const panel = existing ?? document.createElement('div');
    panel.id = tab.button.getAttribute('aria-controls') ?? '';
    panel.setAttribute('aria-labelledby', tab.button.id);
    panel.className = 'vf-tabs__panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');
    panel.replaceChildren(templates[index]?.content.cloneNode(true) ?? document.createDocumentFragment());
    if (!existing) scroller.after(panel);
    // Anything Razor-rendered inside the slot mounts now, as a Vue child
    // component would on a fresh render.
    enhanceContent(panel);
  };

  /** The reference's setActiveValue: the projection onto every tab, the panel, the indicator, then the event. */
  const select = (value: string): void => {
    const tabs = readTabs(tablist);
    for (const tab of tabs) {
      tab.button.setAttribute('aria-selected', isTabsItemSelected(value, tab) ? 'true' : 'false');
      tab.button.setAttribute('tabindex', String(resolveTabsTabIndex(value, tab)));
    }
    paintPanel(tabs, value);
    updateIndicator();
    root.dispatchEvent(new CustomEvent(CHANGE_EVENT, { bubbles: true, detail: { value } }));
  };

  /** The reference's activateTab: a disabled tab is a no-op; the current one notifies again. */
  const activate = (tab: Tab): void => {
    if (tab.disabled) return;
    select(tab.value);
  };

  const handleKeydown = (event: KeyboardEvent, current: Tab): void => {
    const tabs = readTabs(tablist);
    const target = resolveTabsNavigationTarget(tabs, current.value, event.key, keyboardIsRtl(current.button));
    if (!target) return;

    event.preventDefault();
    activate(target as Tab);
    // Within this root, by value - the first occurrence, as the reference's
    // findIndex resolves it.
    tabs.find((tab) => tab.value === target.value)?.button.focus();
  };

  const scrollBy = (direction: 'left' | 'right'): void => {
    const delta = resolveTabsScrollerStep(viewport.clientWidth, STEP_RATIO, MIN_STEP);
    viewport.scrollTo({
      left: direction === 'left' ? viewport.scrollLeft - delta : viewport.scrollLeft + delta,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  // Listeners on the tablist, resolving the tab per event, so a tab the host
  // adds or removes later is still its own root's. Click and keydown only:
  // Enter and Space reach the click handler through the browser.
  tablist.addEventListener('click', (event) => {
    const tab = tabFor(event.target);
    if (tab) activate(tab);
  });
  tablist.addEventListener('keydown', (event) => {
    const tab = tabFor(event.target);
    if (tab) handleKeydown(event, tab);
  });
  left.addEventListener('click', () => scrollBy('left'));
  right.addEventListener('click', () => scrollBy('right'));

  viewport.addEventListener('scroll', () => {
    isScrolling = true;
    if (scrollStopTimeout !== null) window.clearTimeout(scrollStopTimeout);
    scrollStopTimeout = window.setTimeout(() => {
      scrollStopTimeout = null;
      isScrolling = false;
      paintScroller();
      updateIndicator();
    }, SCROLL_STOP_MS);
    updateScrollState();
    updateIndicator();
  });

  function tabFor(target: EventTarget | null): Tab | undefined {
    if (!(target instanceof Element)) return undefined;
    const button = target.closest('button.vf-tabs__tab');
    if (!button || button.parentElement !== tablist) return undefined;
    return readTabs(tablist).find((tab) => tab.button === button);
  }

  // Mount, in the reference's order: the tabs measure once the viewport is
  // known; the first frame readies the controls and the indicator's
  // transition, the second animates the controls.
  updateScrollState();
  updateIndicator();
  window.requestAnimationFrame(() => {
    indicator.classList.add('vf-tabs__indicator--ready');
    controlsReady = true;
    updateScrollState();
    updateIndicator();
    window.requestAnimationFrame(() => {
      controlsAnimated = true;
      paintScroller();
      updateIndicator();
    });
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      updateIndicator();
      updateScrollState();
    }).observe(viewport);
  }
  window.addEventListener('resize', () => {
    updateScrollState();
    updateIndicator();
  });
}

/**
 * Enhances every Razor-owned tabs inside `root`.
 *
 * Idempotent: a root is enhanced once, so calling this again after inserting
 * markup only picks up the new roots. `enhanceContent` is called on each
 * freshly painted panel so other Razor components rendered inside the slot
 * mount as they would on a fresh page.
 */
export function enhanceVueForgeTabs(
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
