import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import { releaseCmOverlayFocus } from './overlay-focus.js';

type CmAnchoredPlacement = 'top' | 'bottom-start' | 'bottom-end';
const arrowX = '--cm-floating-arrow-x';
const arrowY = '--cm-floating-arrow-y';
const arrowAngle = '--cm-floating-arrow-angle';

export type CmAnchoredStyle = {
  inset: 'auto';
  left: string;
  top: string;
  [arrowX]?: string;
  [arrowY]?: '0%' | '100%';
  [arrowAngle]?: '45deg' | '225deg';
};

export function resolveCmAnchoredTarget(
  owner: Element | null | undefined,
  destination: string | Element | false | null | undefined,
): Element | null {
  if (!owner || !destination) return null;
  try {
    // A body portal must remain inside its native dialog, including while the dialog is closed.
    const target =
      typeof destination === 'string'
        ? ((destination === 'body' ? owner.closest('dialog') : null) ?? owner.ownerDocument.querySelector(destination))
        : destination;
    return target?.isConnected && !owner.contains(target) ? target : null;
  } catch {
    return null;
  }
}

export function afterCmFloatingExit(panel: HTMLElement | null | undefined, release: () => void): void {
  if (!panel) return release();
  releaseCmOverlayFocus(panel);
  const exit = panel
    .getAnimations?.()
    .find((animation) => (animation as CSSTransition).transitionProperty === 'display');
  if (!exit) return release();
  const finish = () => {
    // A quick reopen or a second close may cancel this exit while the panel is still painted.
    if (panel.hidden && panel.getClientRects().length === 0) release();
  };
  void exit.finished.then(finish, finish);
}

export function observeCmAnchoredPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: CmAnchoredPlacement,
  gap: number,
  inlineContainer: HTMLElement | null | undefined,
  apply: (style: CmAnchoredStyle) => void,
): () => void {
  let active = true;
  const update = (): void => {
    // Collisions are resolved in viewport coordinates before converting to a local container.
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
    }).then(({ x, y, placement: resolvedPlacement }) => {
      if (!active) return;
      const arrow: Partial<CmAnchoredStyle> = {};
      if (panel.hasAttribute('data-cm-floating-arrow')) {
        const { left, width } = anchor.getBoundingClientRect();
        const above = resolvedPlacement.startsWith('top');
        arrow[arrowX] = `${left + width / 2 - x - panel.clientLeft}px`;
        arrow[arrowY] = above ? '100%' : '0%';
        arrow[arrowAngle] = above ? '225deg' : '45deg';
      }
      if (inlineContainer) {
        const bounds = inlineContainer.getBoundingClientRect();
        x += inlineContainer.scrollLeft - bounds.left - inlineContainer.clientLeft;
        y += inlineContainer.scrollTop - bounds.top - inlineContainer.clientTop;
      }
      apply({ inset: 'auto', left: `${x}px`, top: `${y}px`, ...arrow });
    });
  };
  const stop = autoUpdate(anchor, update, panel);
  update();
  return () => {
    active = false;
    stop();
  };
}

export function attachCmAnchoredPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: CmAnchoredPlacement,
  gap: number,
  inlineContainer: HTMLElement | null,
): () => void {
  const { inset, left, top } = panel.style;
  const arrowProperties = [arrowX, arrowY, arrowAngle] as const;
  const arrowStyles = panel.hasAttribute('data-cm-floating-arrow')
    ? arrowProperties.map(
        (key) => [key, panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)] as const,
      )
    : [];
  const stop = observeCmAnchoredPosition(anchor, panel, placement, gap, inlineContainer, (style) => {
    panel.style.inset = style.inset;
    panel.style.left = style.left;
    panel.style.top = style.top;
    for (const [key] of arrowStyles) if (style[key] !== undefined) panel.style.setProperty(key, style[key]);
  });
  return () => {
    stop();
    panel.style.inset = inset;
    panel.style.left = left;
    panel.style.top = top;
    for (const [key, value, priority] of arrowStyles) panel.style.setProperty(key, value, priority);
  };
}
