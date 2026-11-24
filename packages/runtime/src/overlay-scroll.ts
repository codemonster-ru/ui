const scrollLockAttribute = 'data-cm-modal-scroll';
// Layout and modal code can be bundled separately while locking the same element.
const scrollLock = Symbol.for('@codemonster-ru/ui:overlay-scroll');

interface ScrollLock {
  count: number;
  left: number;
  previous: string | null;
  top: number;
}

type Scrollport = HTMLElement & { [scrollLock]?: ScrollLock };

export function hasOverlayScrollLock(element: HTMLElement): boolean {
  return (element as Scrollport)[scrollLock] !== undefined;
}

export function lockOverlayScroll(element: Scrollport, view: Window): () => void {
  const viewport = element === view.document.documentElement ? view : undefined;
  const left = () => viewport?.scrollX ?? element.scrollLeft;
  const top = () => viewport?.scrollY ?? element.scrollTop;
  const state = element[scrollLock] ?? {
    count: 0,
    left: left(),
    previous: element.getAttribute(scrollLockAttribute),
    top: top(),
  };

  if (state.count === 0) {
    const style = view.getComputedStyle(element);
    const borders = (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
    const width = viewport?.innerWidth ?? element.offsetWidth - borders;
    const needsGutter =
      width - element.clientWidth >= 1 && !style.getPropertyValue('scrollbar-gutter').includes('stable');
    element.setAttribute(scrollLockAttribute, needsGutter ? 'gutter' : 'locked');
    element[scrollLock] = state;
  }
  state.count += 1;

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    state.count -= 1;
    if (state.count !== 0) return;

    delete element[scrollLock];
    if (state.previous === null) element.removeAttribute(scrollLockAttribute);
    else element.setAttribute(scrollLockAttribute, state.previous);
    if (left() !== state.left || top() !== state.top) {
      (viewport ?? element).scrollTo({ left: state.left, top: state.top, behavior: 'instant' });
    }
  };
}
