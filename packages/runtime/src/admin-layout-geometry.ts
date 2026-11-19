const outerShell = '.cm-admin-shell, .cm-admin-layout';
const headerSelector = ':scope > .cm-admin-layout__main > .cm-admin-layout__header';
const measuredAttribute = 'data-cm-admin-layout-measured';
const openAttribute = 'data-cm-mobile-sidebar-open';
const drawerStart = '--cm-admin-layout-drawer-start';
const drawerSize = '--cm-admin-layout-drawer-size';
const stickyStart = '--cm-admin-layout-sticky-start';

export function observeAdminLayoutGeometry(root: Element): () => void {
  const view = root.ownerDocument.defaultView;
  const header = root.querySelector<HTMLElement>(headerSelector);
  const drawer = root.querySelector(':scope > .cm-admin-layout__aside');
  if (!view || !(root instanceof view.HTMLElement) || !header || !drawer) return () => {};

  const ancestors: HTMLElement[] = [];
  const outerHeaders: HTMLElement[] = [];
  for (let node = header.parentElement; node; node = node.parentElement) {
    ancestors.push(node);
    if (node === root || !node.matches(outerShell)) continue;
    const topbar = node.querySelector<HTMLElement>(`:scope > .cm-admin-shell__topbar, ${headerSelector}`);
    if (topbar) outerHeaders.push(topbar);
  }

  const main = root.querySelector(':scope > .cm-admin-layout__main');
  const backdrop = root.querySelector(':scope > .cm-admin-layout__mobile-backdrop');
  const ownedInert = new Set<HTMLElement>();
  const visualViewport = view.visualViewport;
  let tracksScroll = false;
  const releaseCoveredRegions = () => {
    for (const region of ownedInert) region.removeAttribute('inert');
    ownedInert.clear();
  };
  const updateCoveredRegions = () => {
    if (!tracksScroll || !backdrop || root.getAttribute(openAttribute) !== 'true') {
      releaseCoveredRegions();
      return;
    }
    const coveredRegions = main?.querySelectorAll<HTMLElement>(
      ':scope > :is(.cm-admin-layout__content, .cm-admin-layout__footer)',
    );
    for (const region of coveredRegions ?? []) {
      if (region.hasAttribute('inert')) continue;
      if (region.contains(root.ownerDocument.activeElement)) {
        header.querySelector<HTMLElement>('[data-cm-mobile-sidebar-toggle]')?.focus({ preventScroll: true });
      }
      region.setAttribute('inert', '');
      ownedInert.add(region);
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
    updateCoveredRegions();
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
    const start = Math.max(top, header.getBoundingClientRect().bottom);
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
  const states = typeof view.MutationObserver === 'function' ? new view.MutationObserver(updateCoveredRegions) : null;
  states?.observe(root, { attributes: true, attributeFilter: [openAttribute] });
  if (main) states?.observe(main, { childList: true });
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  for (const element of [root, header, ...ancestors, ...outerHeaders]) resize?.observe(element);
  view.addEventListener('resize', schedule);
  visualViewport?.addEventListener('resize', schedule);
  update();
  return () => {
    states?.disconnect();
    releaseCoveredRegions();
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
