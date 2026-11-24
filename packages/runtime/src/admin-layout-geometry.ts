import { hasOverlayScrollLock, lockOverlayScroll } from './overlay-scroll.js';
import { findShellControl } from './shell-ownership.js';

const outerShell = '.cm-admin-shell, .cm-admin-layout';
const headerSelector = ':scope > .cm-admin-layout__main > .cm-admin-layout__header';
const measuredAttribute = 'data-cm-admin-layout-measured';
const openAttribute = 'data-cm-mobile-sidebar-open';
const drawerStart = '--cm-admin-layout-drawer-start';
const drawerSize = '--cm-admin-layout-drawer-size';
const stickyStart = '--cm-admin-layout-sticky-start';
const scrollableOverflow = /^(auto|scroll|overlay)$/u;

export function observeAdminLayoutGeometry(root: Element): () => void {
  const view = root.ownerDocument.defaultView;
  const header = root.querySelector<HTMLElement>(headerSelector);
  const main = header?.parentElement;
  const drawer = root.querySelector<HTMLElement>(':scope > .cm-admin-layout__aside');
  if (!view || !(root instanceof view.HTMLElement) || !header || !main || !drawer) return () => {};

  const ancestors: HTMLElement[] = [];
  const outerHeaders: HTMLElement[] = [];
  for (let node: HTMLElement | null = main; node; node = node.parentElement) {
    ancestors.push(node);
    if (node === root || !node.matches(outerShell)) continue;
    const topbar = node.querySelector<HTMLElement>(`:scope > .cm-admin-shell__topbar, ${headerSelector}`);
    if (topbar) outerHeaders.push(topbar);
  }

  const backdrop = root.querySelector(':scope > .cm-admin-layout__mobile-backdrop');
  const { ownerDocument } = root;
  const visualViewport = view.visualViewport;
  let tracksScroll = false;
  let overlayOpen = false;
  let ownsInert = false;
  let ownsDrawerTabIndex = false;
  let scrollLocks: (() => void)[] = [];
  const containWheel = (event: WheelEvent) => {
    if (event.ctrlKey || !event.deltaY || !(event.target instanceof view.Element)) return;
    for (
      let element: Element | null = event.target;
      element && drawer.contains(element);
      element = element.parentElement
    ) {
      const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;
      const canScroll = event.deltaY < 0 ? element.scrollTop > 0 : remaining > 1;
      if (canScroll && scrollableOverflow.test(view.getComputedStyle(element).overflowY)) return;
    }
    // A wheel gesture can escape a locked iframe when there is no menu content left to scroll.
    event.preventDefault();
  };
  const releaseOverlay = () => {
    root.removeEventListener('wheel', containWheel, true);
    for (const release of scrollLocks) release();
    scrollLocks = [];
    if (ownsInert) main.removeAttribute('inert');
    if (ownsDrawerTabIndex) drawer.removeAttribute('tabindex');
    ownsInert = false;
    ownsDrawerTabIndex = false;
  };
  const updateOverlay = () => {
    const open = tracksScroll && backdrop !== null && root.getAttribute(openAttribute) === 'true';
    if (overlayOpen === open) return;
    overlayOpen = open;
    const active = ownerDocument.activeElement;
    if (!open) {
      releaseOverlay();
      if (tracksScroll && (drawer.contains(active) || active === ownerDocument.body)) {
        const toggle =
          findShellControl(root, '[data-cm-mobile-sidebar-toggle]:not(:disabled, [aria-disabled="true"])') ??
          header.querySelector<HTMLElement>(
            '.cm-admin-layout__mobile-toggle :is(button, [tabindex="0"]):not(:disabled, [aria-disabled="true"])',
          );
        toggle?.focus({ preventScroll: true });
      }
      return;
    }
    const { body, documentElement, scrollingElement } = ownerDocument;
    const viewportUsesBodyOverflow = view.getComputedStyle(documentElement).overflowY === 'visible';
    const scrollports = ancestors.filter(
      (element) =>
        element !== main &&
        element !== documentElement &&
        element !== scrollingElement &&
        (element !== body || !viewportUsesBodyOverflow) &&
        (hasOverlayScrollLock(element) || scrollableOverflow.test(view.getComputedStyle(element).overflowY)),
    );
    scrollLocks = [...scrollports, documentElement].map((element) => lockOverlayScroll(element, view));
    root.addEventListener('wheel', containWheel, { capture: true, passive: false });
    if (main.contains(active) || active === ownerDocument.body) {
      if (!drawer.hasAttribute('tabindex')) {
        drawer.tabIndex = -1;
        ownsDrawerTabIndex = true;
      }
      drawer.focus({ preventScroll: true });
    }
    if (!main.hasAttribute('inert')) {
      main.setAttribute('inert', '');
      ownsInert = true;
    }
  };
  const setPixels = (name: string, value: number) => {
    const cssValue = `${value}px`;
    if (root.style.getPropertyValue(name) !== cssValue) root.style.setProperty(name, cssValue);
  };

  const update = () => {
    const mobile = view.getComputedStyle(drawer).position !== 'fixed';
    if (mobile !== tracksScroll) {
      tracksScroll = mobile;
      if (mobile) {
        view.addEventListener('scroll', schedule, { capture: true, passive: true });
        visualViewport?.addEventListener('scroll', schedule);
      } else {
        view.removeEventListener('scroll', schedule, true);
        visualViewport?.removeEventListener('scroll', schedule);
      }
    }
    updateOverlay();
    if (!mobile) return;

    const bounds = root.getBoundingClientRect();
    const scale = bounds.height / root.offsetHeight || 1;
    let top = visualViewport?.offsetTop ?? 0;
    let bottom = top + (visualViewport?.height ?? view.document.documentElement.clientHeight);
    let scrollportTop: number | undefined;
    for (const ancestor of ancestors) {
      if (ancestor === view.document.scrollingElement) continue;
      const overflow = view.getComputedStyle(ancestor).overflowY;
      if (overflow === 'visible') continue;
      const rect = ancestor.getBoundingClientRect();
      const scale = rect.height / ancestor.offsetHeight || 1;
      const clientTop = rect.top + ancestor.clientTop * scale;
      top = Math.max(top, clientTop);
      bottom = Math.min(bottom, clientTop + ancestor.clientHeight * scale);
      if (overflow !== 'clip') scrollportTop ??= clientTop;
    }

    // If the layout shares a scrollport with an outer sticky bar, leave its own toggle below it.
    const stickyBottom = outerHeaders.reduce((edge, element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > bounds.left && rect.left < bounds.right && rect.top < bottom
        ? Math.max(edge, rect.bottom)
        : edge;
    }, scrollportTop ?? 0);
    setPixels(stickyStart, (stickyBottom - (scrollportTop ?? 0)) / scale);
    const start = Math.max(top, bounds.top, stickyBottom);
    setPixels(drawerStart, (start - bounds.top) / scale - root.clientTop + root.scrollTop);
    setPixels(drawerSize, Math.max(0, (bottom - start) / scale));
    if (!root.hasAttribute(measuredAttribute)) root.setAttribute(measuredAttribute, '');
  };

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    if (!view.requestAnimationFrame) {
      update();
      return;
    }
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  const states = typeof view.MutationObserver === 'function' ? new view.MutationObserver(updateOverlay) : null;
  states?.observe(root, { attributes: true, attributeFilter: [openAttribute] });
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  for (const element of [root, header, ...ancestors, ...outerHeaders]) resize?.observe(element);
  view.addEventListener('resize', schedule);
  visualViewport?.addEventListener('resize', schedule);
  update();
  return () => {
    states?.disconnect();
    releaseOverlay();
    resize?.disconnect();
    if (frame) view.cancelAnimationFrame(frame);
    view.removeEventListener('scroll', schedule, true);
    view.removeEventListener('resize', schedule);
    visualViewport?.removeEventListener('scroll', schedule);
    visualViewport?.removeEventListener('resize', schedule);
    for (const name of [drawerStart, drawerSize, stickyStart]) root.style.removeProperty(name);
    root.removeAttribute(measuredAttribute);
  };
}
