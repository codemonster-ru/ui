import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import { cmFocusableSelector } from './core/disclosure.js';
import { releaseCmOverlayFocus } from './overlay-focus.js';

const oppositePlacement = {
  bottom: 'top',
  'bottom-end': 'top-end',
  'bottom-start': 'top-start',
  left: 'right',
  'left-start': 'right-start',
  right: 'left',
  'right-start': 'left-start',
  top: 'bottom',
} as const;
type CmAnchoredPlacement = keyof typeof oppositePlacement;
const arrowX = '--cm-floating-arrow-x';
const arrowY = '--cm-floating-arrow-y';
const arrowAngle = '--cm-floating-arrow-angle';
const anchorWidth = '--cm-floating-anchor-width';

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
    const target = typeof destination === 'string' ? owner.ownerDocument.querySelector(destination) : destination;
    if (!target?.isConnected || owner.contains(target)) return null;
    // Only descendants of the same native dialog are painted in its modal layer.
    const dialog = owner.closest('dialog');
    return dialog && target.closest('dialog') !== dialog ? dialog : target;
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
  apply: (style: CmAnchoredStyle, resolvedPlacement: string) => void,
): () => void {
  let active = true;
  const previousWidth = panel.style.getPropertyValue(anchorWidth);
  const previousWidthPriority = panel.style.getPropertyPriority(anchorWidth);
  let fixedWidth: string | undefined;
  const update = (): void => {
    // Inline panels in a native modal use fixed positioning to escape its scroll container.
    const viewportPosition =
      !inlineContainer || panel.ownerDocument.defaultView?.getComputedStyle(panel).position === 'fixed';
    if (inlineContainer && viewportPosition) {
      const width = `${anchor.getBoundingClientRect().width}px`;
      if (width !== fixedWidth) {
        panel.style.setProperty(anchorWidth, width);
        fixedWidth = width;
      }
    }
    // Collisions are resolved in viewport coordinates before converting to a local container.
    void computePosition(anchor, panel, {
      placement,
      strategy: 'fixed',
      middleware: [offset(gap), flip({ placements: [placement, oppositePlacement[placement]] }), shift()],
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
      if (inlineContainer && !viewportPosition) {
        const bounds = inlineContainer.getBoundingClientRect();
        x += inlineContainer.scrollLeft - bounds.left - inlineContainer.clientLeft;
        y += inlineContainer.scrollTop - bounds.top - inlineContainer.clientTop;
      }
      apply({ inset: 'auto', left: `${x}px`, top: `${y}px`, ...arrow }, resolvedPlacement);
    });
  };
  const stop = autoUpdate(anchor, update, panel);
  update();
  return () => {
    active = false;
    stop();
    if (fixedWidth !== undefined) panel.style.setProperty(anchorWidth, previousWidth, previousWidthPriority);
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

/** Compact menu bars expand in normal flow. Attach floating placement only for the wide cascade. */
export function attachCmMenuBarSubmenuPosition(anchor: HTMLElement, panel: HTMLElement, topLevel: boolean): () => void {
  const view = anchor.ownerDocument.defaultView;
  const wide = view?.matchMedia?.('(width > 640px)');
  if (!view || !wide) return () => {};

  let stop: (() => void) | undefined;
  const update = () => {
    stop?.();
    stop = undefined;
    if (!wide.matches) return;
    const rtl = view.getComputedStyle(anchor).direction === 'rtl';
    const placement = topLevel ? (rtl ? 'bottom-end' : 'bottom-start') : rtl ? 'left-start' : 'right-start';
    stop = attachCmAnchoredPosition(anchor, panel, placement, 4, panel.parentElement);
  };
  wide.addEventListener('change', update);
  update();
  return () => {
    wide.removeEventListener('change', update);
    stop?.();
  };
}

/** Observe the opener against the modal's scrollable body, including when a panel escapes that clip. */
export function observeCmModalMenuBarAnchor(
  anchor: HTMLElement,
  onHidden: (() => void) | undefined,
  onVisible?: () => void,
): (() => void) | undefined {
  const body = anchor.closest('.cm-dialog__body, .cm-drawer__body');
  const Observer = anchor.ownerDocument.defaultView?.IntersectionObserver;
  if (!body?.closest('dialog:modal') || !Observer) return;

  const observer = new Observer(
    (entries) => {
      const entry = entries.at(-1);
      if (!entry) return;
      if (entry.intersectionRatio === 0) onHidden?.();
      else onVisible?.();
    },
    { root: body, threshold: Number.EPSILON },
  );
  observer.observe(anchor);
  return () => {
    observer.disconnect();
    observer.takeRecords();
  };
}

/** Move focus out of a closing submenu without bringing its clipped opener back into view. */
export function focusCmModalMenuBarFallback(anchor: HTMLElement, items: readonly HTMLElement[]): void {
  const modal = anchor.closest<HTMLDialogElement>('dialog:modal');
  const view = anchor.ownerDocument.defaultView;
  if (!modal || !view) return;

  const origin = anchor.getBoundingClientRect();
  let closest: HTMLElement | undefined;
  let distance = Infinity;
  for (const item of items) {
    if (item === anchor) continue;
    const visible = visibleModalItemBounds(item, modal, view);
    if (!visible) continue;

    const dx = (visible.left + visible.right - origin.left - origin.right) / 2;
    const dy = (visible.top + visible.bottom - origin.top - origin.bottom) / 2;
    const score = dx * dx + dy * dy;
    if (score >= distance) continue;
    closest = item;
    distance = score;
  }
  (closest ?? modal).focus({ preventScroll: true });
  if (closest) return;

  // Native tab order can still start at the clipped opener after programmatically focusing the dialog.
  const fromModal = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || event.defaultPrevented || event.target !== modal || !modal.matches(':modal')) return;
    event.preventDefault();
    const items = [...modal.querySelectorAll<HTMLElement>(cmFocusableSelector)];
    if (event.shiftKey) items.reverse();
    const next = items.find(
      (item) =>
        item.closest('dialog') === modal &&
        item.tabIndex >= 0 &&
        !item.matches(':disabled, [aria-disabled="true"]') &&
        visibleModalItemBounds(item, modal, view),
    );
    next?.focus({ preventScroll: true });
  };
  modal.addEventListener('keydown', fromModal);
  modal.addEventListener('blur', () => modal.removeEventListener('keydown', fromModal), { once: true });
}

function visibleModalItemBounds(item: HTMLElement, modal: HTMLDialogElement, view: Window) {
  if (item.closest('[hidden], [inert], [aria-hidden="true"]') || view.getComputedStyle(item).visibility !== 'visible')
    return;

  const bounds = item.getBoundingClientRect();
  let left = Math.max(bounds.left, 0);
  let right = Math.min(bounds.right, view.innerWidth);
  let top = Math.max(bounds.top, 0);
  let bottom = Math.min(bounds.bottom, view.innerHeight);
  for (let parent = item.parentElement; parent && parent !== modal; parent = parent.parentElement) {
    const { overflowX, overflowY } = view.getComputedStyle(parent);
    if (overflowX === 'visible' && overflowY === 'visible') continue;
    const clip = parent.getBoundingClientRect();
    if (overflowX !== 'visible') {
      left = Math.max(left, clip.left + parent.clientLeft);
      right = Math.min(right, clip.left + parent.clientLeft + parent.clientWidth);
    }
    if (overflowY !== 'visible') {
      top = Math.max(top, clip.top + parent.clientTop);
      bottom = Math.min(bottom, clip.top + parent.clientTop + parent.clientHeight);
    }
  }
  if (left < right && top < bottom) return { left, right, top, bottom };
}
