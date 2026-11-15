import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';

export function attachCmAnchoredPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: 'top' | 'bottom-start' | 'bottom-end',
  gap: number,
  inlineContainer: HTMLElement | null,
): () => void {
  let active = true;
  const { inset, left, top } = panel.style;
  const update = (): void => {
    void computePosition(anchor, panel, {
      placement,
      strategy: 'fixed',
      middleware: [
        offset(gap),
        flip({
          placements: [
            placement,
            placement === 'top' ? 'bottom' : placement === 'bottom-end' ? 'top-end' : 'top-start',
          ],
        }),
        shift(),
      ],
    }).then(({ x, y }) => {
      if (!active) return;
      if (inlineContainer) {
        const bounds = inlineContainer.getBoundingClientRect();
        x += inlineContainer.scrollLeft - bounds.left - inlineContainer.clientLeft;
        y += inlineContainer.scrollTop - bounds.top - inlineContainer.clientTop;
      }
      panel.style.inset = 'auto';
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
  };
  const stop = autoUpdate(anchor, update, panel);
  update();
  return () => {
    active = false;
    stop();
    panel.style.inset = inset;
    panel.style.left = left;
    panel.style.top = top;
  };
}
