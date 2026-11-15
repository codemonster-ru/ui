const scrollLockAttribute = 'data-cm-modal-scroll';

interface NativeModalScrollState {
  count: number;
  left: number;
  previous: string | null;
  top: number;
}

const documentScroll = new WeakMap<Document, NativeModalScrollState>();

function lockDocumentScroll(document: Document, view: Window): () => void {
  const root = document.documentElement;
  const state = documentScroll.get(document) ?? {
    count: 0,
    left: view.scrollX,
    previous: root.getAttribute(scrollLockAttribute),
    top: view.scrollY,
  };

  if (state.count === 0) {
    const scrollbarGutter = view.getComputedStyle(root).getPropertyValue('scrollbar-gutter');
    const needsGutter = view.innerWidth > root.clientWidth && !scrollbarGutter.includes('stable');
    root.setAttribute(scrollLockAttribute, needsGutter ? 'gutter' : 'locked');
    documentScroll.set(document, state);
  }
  state.count += 1;

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    state.count -= 1;
    if (state.count !== 0) return;

    documentScroll.delete(document);
    if (state.previous === null) root.removeAttribute(scrollLockAttribute);
    else root.setAttribute(scrollLockAttribute, state.previous);
    if (view.scrollX !== state.left || view.scrollY !== state.top) {
      view.scrollTo({ left: state.left, top: state.top, behavior: 'instant' });
    }
  };
}

export function enterCmNativeModal(dialog: HTMLDialogElement, releaseScroll?: () => void): (() => void) | undefined {
  const document = dialog.ownerDocument;
  const view = document.defaultView;
  if (!view || !dialog.isConnected || typeof dialog.showModal !== 'function') return releaseScroll;

  const lockScroll = !dialog.hasAttribute('data-cm-modal-unlocked');
  if (!lockScroll) releaseScroll?.();
  const release = lockScroll ? (releaseScroll ?? lockDocumentScroll(document, view)) : undefined;
  if (!dialog.matches(':modal')) {
    // Server markup may already be open without belonging to the browser's modal stack.
    dialog.removeAttribute('open');
    try {
      dialog.showModal();
    } catch (error) {
      release?.();
      throw error;
    }
  }
  return release;
}
