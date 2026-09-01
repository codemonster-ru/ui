/**
 * Table-of-contents rules, with no DOM and no framework.
 *
 * The markup is a nav of anchor links and works without JavaScript: a browser follows `#id` on its
 * own. Smooth scrolling and a sticky-header offset are the enhancement layered over it, and the
 * arithmetic for that lives here so both adapters compute the same destination.
 */

export interface CmTableOfContentsCoreItem {
  readonly href?: string;
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

/** Heading levels run 1 to 6; anything outside that is clamped rather than rejected. */
export function resolveHeadingLevel(level: number | undefined): number {
  if (level === undefined || !Number.isFinite(level) || level < 1) {
    return 1;
  }

  return Math.min(Math.trunc(level), 6);
}

/** An item links to its own anchor unless it names somewhere else. */
export function resolveItemHref(item: CmTableOfContentsCoreItem): string {
  return item.href ?? `#${item.id}`;
}

/**
 * Reports whether the enhancement has anything to do.
 *
 * With neither smooth scrolling nor an offset, native anchor navigation is already correct, and
 * intercepting the click would replace working behaviour with a reimplementation of it.
 */
export function needsScrollEnhancement(smooth: boolean, scrollOffset: number): boolean {
  return smooth || scrollOffset > 0;
}

/**
 * Resolves the document position a link scrolls to, given where its target currently sits.
 *
 * `targetTop` is the target's position relative to the viewport and `scrollY` the current scroll,
 * which is what a caller reads from the DOM. The result never goes below zero, so an offset larger
 * than the target's position scrolls to the top rather than past it.
 */
export function resolveScrollTarget(options: {
  readonly scrollOffset: number;
  readonly scrollY: number;
  readonly targetTop: number;
}): number {
  return Math.max(0, options.scrollY + options.targetTop - options.scrollOffset);
}

/** Reads the element id a same-document link points at, or `null` for anything else. */
export function resolveAnchorTargetId(href: string): string | null {
  if (!href.startsWith('#')) {
    return null;
  }

  const id = decodeURIComponent(href.slice(1));
  return id === '' ? null : id;
}
