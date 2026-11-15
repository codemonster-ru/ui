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

export function observeTabScroll(viewport: HTMLElement, onChange: (edges: CmTabScrollEdges) => void): () => void {
  let previous: CmTabScrollEdges | undefined;
  function refresh(): void {
    const edges = scrollEdges(viewport);
    if (previous?.start === edges.start && previous.end === edges.end) return;
    previous = edges;
    onChange(edges);
  }

  const view = viewport.ownerDocument.defaultView;
  const resize = view?.ResizeObserver ? new view.ResizeObserver(refresh) : undefined;
  resize?.observe(viewport);
  for (const tab of viewport.querySelectorAll(tabSelector)) resize?.observe(tab);
  view?.addEventListener('resize', refresh);
  viewport.addEventListener('scroll', refresh, { passive: true });
  refresh();
  return () => {
    viewport.removeEventListener('scroll', refresh);
    view?.removeEventListener('resize', refresh);
    resize?.disconnect();
  };
}

export function scrollTabList(viewport: HTMLElement, edge: CmTabScrollEdge, invoker: HTMLElement): void {
  const isRtl = rtl(viewport);
  const direction = (edge === 'start' ? -1 : 1) * (isRtl ? -1 : 1);
  const step = viewport.clientWidth * 0.75;
  const displacement = isRtl ? -viewport.scrollLeft : viewport.scrollLeft;
  const remaining = edge === 'start' ? displacement : viewport.scrollWidth - viewport.clientWidth - displacement;
  const reduce = viewport.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  viewport.scrollBy({ left: direction * step, behavior: reduce ? 'instant' : 'smooth' });
  if (remaining > step + 1 || invoker !== viewport.ownerDocument.activeElement) return;
  const tabs = viewport.querySelectorAll<HTMLElement>(`${tabSelector}:not(:disabled)`);
  (edge === 'start' ? tabs[0] : tabs[tabs.length - 1])?.focus({ preventScroll: true });
}
