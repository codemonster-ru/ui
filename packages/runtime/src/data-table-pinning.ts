export function observeDataTablePins(
  table: HTMLTableElement,
  apply: (offsets: Readonly<Record<string, number>>) => void,
): () => void {
  const columns = [...(table.tHead?.rows[0]?.cells ?? [])];
  const headers = columns.filter((cell) => cell.dataset.cmDataTablePin);
  const middle = columns.filter((cell) => !cell.dataset.cmDataTablePin);
  const scroll = table.parentElement;
  const constrained = 'data-cm-data-table-pins-constrained';
  const width = (element: Element) => element.getBoundingClientRect().width;
  const view = table.ownerDocument.defaultView;

  const measure = (): void => {
    const offsets: [string, number][] = [];
    let pinnedWidth = 0;
    for (const side of ['start', 'end']) {
      const ordered = side === 'start' ? headers : [...headers].reverse();
      let offset = 0;
      for (const header of ordered) {
        const key = header.dataset.cmDataTableColumn;
        if (!key || header.dataset.cmDataTablePin !== side) continue;
        offsets.push([key, offset]);
        offset += width(header);
      }
      pinnedWidth += offset;
    }
    // Leave space to bring a complete unpinned column into view.
    if (scroll) table.toggleAttribute(constrained, pinnedWidth + Math.max(0, ...middle.map(width)) > width(scroll));
    apply(Object.fromEntries(offsets));
  };
  measure();

  const observer = view?.ResizeObserver ? new view.ResizeObserver(measure) : null;
  if (observer) (scroll ? [scroll, ...columns] : columns).forEach((element) => observer.observe(element));
  else view?.addEventListener('resize', measure);

  return () => {
    observer?.disconnect();
    view?.removeEventListener('resize', measure);
    table.removeAttribute(constrained);
  };
}
