export function observeDataTablePins(
  table: HTMLTableElement,
  apply: (offsets: Readonly<Record<string, number>>) => void,
): () => void {
  const columns = [...(table.tHead?.rows[0]?.cells ?? [])];
  const headers = columns.filter((cell) => cell.dataset.cmDataTablePin);
  const middle = columns.filter((cell) => !cell.dataset.cmDataTablePin);
  const scroll = table.parentElement;
  const constrained = 'data-cm-data-table-pins-constrained';
  const view = table.ownerDocument.defaultView;
  const measure = (): void => {
    const offsets: [string, number][] = [];
    for (const side of ['start', 'end']) {
      const ordered = side === 'start' ? headers : [...headers].reverse();
      let offset = 0;
      for (const header of ordered) {
        const key = header.dataset.cmDataTableColumn;
        if (!key || header.dataset.cmDataTablePin !== side) continue;
        offsets.push([key, offset]);
        offset += header.getBoundingClientRect().width;
      }
    }
    if (scroll?.classList.contains('cm-data-table__scroll')) {
      const pinWidth = headers.reduce((width, header) => width + header.offsetWidth, 0);
      const centerWidth = middle.reduce((width, header) => Math.max(width, header.offsetWidth), 0);
      // Leave space to bring a complete unpinned column into view.
      table.toggleAttribute(constrained, scroll.clientWidth < pinWidth + centerWidth);
    }
    apply(Object.fromEntries(offsets));
  };
  measure();

  const observer = view?.ResizeObserver ? new view.ResizeObserver(measure) : null;
  if (observer) {
    columns.forEach((header) => observer.observe(header));
    if (scroll) observer.observe(scroll);
    return () => {
      observer.disconnect();
      table.removeAttribute(constrained);
    };
  }

  view?.addEventListener('resize', measure);
  return () => {
    view?.removeEventListener('resize', measure);
    table.removeAttribute(constrained);
  };
}
