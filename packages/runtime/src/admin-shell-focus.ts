const bodySelector = ':scope > .cm-admin-shell__body';
const topbarSelector = ':scope > .cm-admin-shell__topbar';
const topbarSizeProperty = '--cm-admin-shell-topbar-size';
const scrollportSizeProperty = '--cm-admin-shell-scrollport-size';
const scrollableOverflow = /^(auto|scroll|hidden|overlay)$/u;
const subscriptions = new WeakMap<Element, { count: number; disconnect: () => void }>();

function scrollContainer(topbar: Element, view: Window): Element | null {
  const { body, documentElement, scrollingElement } = topbar.ownerDocument;
  const viewportUsesBodyOverflow = view.getComputedStyle(documentElement).overflowY === 'visible';
  for (let parent = topbar.parentElement; parent && parent !== documentElement; parent = parent.parentElement) {
    if (parent === scrollingElement || (parent === body && viewportUsesBodyOverflow)) break;
    if (scrollableOverflow.test(view.getComputedStyle(parent).overflowY)) return parent;
  }
  return scrollingElement;
}

function enhanceAdminShellFocus(root: Element): () => void {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view || !(root instanceof view.HTMLElement)) return () => {};

  const topbar = root.querySelector(topbarSelector);
  if (!topbar) return () => {};

  const scroller = scrollContainer(topbar, view);
  const embeddedScroller = scroller === document.scrollingElement ? null : scroller;
  const topbars = [topbar];
  for (let parent = root.parentElement?.closest('.cm-admin-shell'); parent;) {
    const ancestor = parent.querySelector(topbarSelector);
    if (ancestor && scrollContainer(ancestor, view) === scroller) topbars.push(ancestor);
    parent = parent.parentElement?.closest('.cm-admin-shell') ?? null;
  }
  const measure = (): void => {
    const size = Math.max(...topbars.map((bar) => bar.getBoundingClientRect().height));
    root.style.setProperty(topbarSizeProperty, `${size}px`);
    if (embeddedScroller) root.style.setProperty(scrollportSizeProperty, `${embeddedScroller.clientHeight}px`);
  };
  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(measure) : null;
  for (const bar of topbars) observer?.observe(bar);
  if (embeddedScroller) observer?.observe(embeddedScroller);
  measure();

  let frame = 0;
  const reveal = (event: Event): void => {
    const target = event.target;
    if (
      typeof view.requestAnimationFrame !== 'function' ||
      !(target instanceof view.Element) ||
      !root.querySelector(bodySelector)?.contains(target)
    ) {
      return;
    }

    view.cancelAnimationFrame(frame);
    // Wait for native Tab scrolling before correcting overlap with this shell's own topbar.
    frame = view.requestAnimationFrame(() => {
      if (document.activeElement !== target || !target.matches(':focus-visible')) return;

      const focus = view.getComputedStyle(target);
      const outline = (parseFloat(focus.outlineWidth) || 0) + (parseFloat(focus.outlineOffset) || 0);
      const ring = parseFloat(focus.getPropertyValue('--cm-focus-ring-width')) || 0;
      const clearance = Math.max(outline, ring) + 1;
      const box = target.getBoundingClientRect();
      const header = topbar.getBoundingClientRect();
      const left = Math.max(0, box.left - clearance, header.left);
      const right = Math.min(view.innerWidth, box.right + clearance, header.right);
      const top = Math.max(0, box.top - clearance, header.top);
      const bottom = Math.min(view.innerHeight, box.bottom + clearance, header.bottom);
      if (right <= left || bottom <= top) return;

      const hits = document.elementsFromPoint((left + right) / 2, (top + bottom) / 2);
      const headerHit = hits.findIndex((element) => topbar.contains(element));
      const focusHit = hits.findIndex((element) => target.contains(element));
      if (headerHit >= 0 && (focusHit < 0 || headerHit < focusHit)) {
        // Sticky follows the header's scrollport, which may differ from one inside the focused slot.
        scrollContainer(topbar, view)?.scrollBy({
          top: -Math.ceil(header.bottom - box.top + clearance),
          behavior: 'instant',
        });
      }
    });
  };
  root.addEventListener('focusin', reveal);
  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    root.removeEventListener('focusin', reveal);
    observer?.disconnect();
    root.style.removeProperty(topbarSizeProperty);
    root.style.removeProperty(scrollportSizeProperty);
  };
}

// Vue and a document-level runtime may both enhance the same stateless frame.
export function observeAdminShellFocus(root: Element): () => void {
  const subscription = subscriptions.get(root) ?? { count: 0, disconnect: enhanceAdminShellFocus(root) };
  subscription.count++;
  subscriptions.set(root, subscription);
  return () => {
    subscription.count--;
    if (subscription.count === 0) {
      subscription.disconnect();
      subscriptions.delete(root);
    }
  };
}
