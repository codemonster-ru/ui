import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';

export type CmAnchoredStyle = {
  inset: 'auto';
  left: string;
  top: string;
};

export function observeCmAnchoredPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: 'top' | 'bottom-start' | 'bottom-end',
  gap: number,
  inlineContainer: HTMLElement | null | undefined,
  apply: (position: CmAnchoredStyle) => void,
): () => void {
  let active = true;
  const update = (): void => {
    // Collision middleware uses viewport bounds in fixed mode, even when the panel stays inline.
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
      apply({ inset: 'auto', left: `${x}px`, top: `${y}px` });
    });
  };
  const stop = autoUpdate(anchor, update, panel);
  update();
  return () => {
    active = false;
    stop();
  };
}
