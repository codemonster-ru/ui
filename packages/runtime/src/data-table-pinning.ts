export function observeDataTablePins(
  table: HTMLTableElement,
  apply: (offsets: Readonly<Record<string, number>>) => void,
): () => void {
  const headers = [...(table.tHead?.rows[0]?.cells ?? [])].filter((cell) => cell.dataset.cmDataTablePin);
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
    apply(Object.fromEntries(offsets));
  };
  measure();

  const observer = view?.ResizeObserver ? new view.ResizeObserver(measure) : null;
  if (observer) {
    headers.forEach((header) => observer.observe(header));
    return () => observer.disconnect();
  }

  view?.addEventListener('resize', measure);
  return () => view?.removeEventListener('resize', measure);
}
