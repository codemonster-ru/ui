export type CmTabScrollEdge = 'start' | 'end';

export interface CmTabScrollEdges {
  start: boolean;
  end: boolean;
}

const tabSelector = ':scope > .cm-tabs__tab[role="tab"]';

function rtl(viewport: HTMLElement): boolean {
  return viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction === 'rtl';
}

function scrollEdges(viewport: HTMLElement): CmTabScrollEdges {
  const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  if (maximum <= 1) return { start: false, end: false };
  const displacement = rtl(viewport) ? -viewport.scrollLeft : viewport.scrollLeft;
  return { start: displacement > 1, end: maximum - displacement > 1 };
}

export function observeHorizontalScroll(
  viewport: HTMLElement,
  onChange: (edges: CmTabScrollEdges) => void,
  onLayout?: () => void,
  itemSelector = tabSelector,
): () => void {
  let previous: CmTabScrollEdges | undefined;
  function refresh(): void {
    const edges = scrollEdges(viewport);
    if (previous?.start === edges.start && previous.end === edges.end) return;
    previous = edges;
    onChange(edges);
  }

  function layout(): void {
    refresh();
    onLayout?.();
  }

  const view = viewport.ownerDocument.defaultView;
  const resize = view?.ResizeObserver ? new view.ResizeObserver(layout) : undefined;
  resize?.observe(viewport);
  for (const item of viewport.querySelectorAll(itemSelector)) resize?.observe(item);
  view?.addEventListener('resize', layout);
  viewport.addEventListener('scroll', refresh, { passive: true });
  layout();
  return () => {
    viewport.removeEventListener('scroll', refresh);
    view?.removeEventListener('resize', layout);
    resize?.disconnect();
  };
}

export function tabIndicatorGeometry(viewport: HTMLElement): { left: number; width: number } | null {
  const selected = viewport.querySelector(`${tabSelector}[aria-selected="true"]`);
  if (!selected) return null;
  const tab = selected.getBoundingClientRect();
  const list = viewport.getBoundingClientRect();
  return tab.width ? { left: tab.left - list.left + viewport.scrollLeft, width: tab.width } : null;
}

export function focusHorizontalEdge(viewport: HTMLElement, edge: CmTabScrollEdge, itemSelector: string): void {
  const items = viewport.querySelectorAll<HTMLElement>(itemSelector);
  (edge === 'start' ? items[0] : items[items.length - 1])?.focus({ preventScroll: true });
}

export function scrollHorizontalList(
  viewport: HTMLElement,
  edge: CmTabScrollEdge,
  invoker: HTMLElement,
  itemSelector = `${tabSelector}:not(:disabled)`,
  step = viewport.clientWidth * 0.75,
): void {
  const isRtl = rtl(viewport);
  const direction = (edge === 'start' ? -1 : 1) * (isRtl ? -1 : 1);
  const displacement = isRtl ? -viewport.scrollLeft : viewport.scrollLeft;
  const remaining = edge === 'start' ? displacement : viewport.scrollWidth - viewport.clientWidth - displacement;
  const reduce = viewport.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  viewport.scrollBy({ left: direction * step, behavior: reduce ? 'instant' : 'smooth' });
  if (remaining > step + 1 || invoker !== viewport.ownerDocument.activeElement) return;
  focusHorizontalEdge(viewport, edge, itemSelector);
}

export { observeHorizontalScroll as observeTabScroll, scrollHorizontalList as scrollTabList };
