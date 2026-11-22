export { releaseCmOverlayFocus } from './overlay-focus.js';

const scrollLockAttribute = 'data-cm-modal-scroll';

interface NativeModalScrollState {
  count: number;
  left: number;
  previous: string | null;
  top: number;
}

const documentScroll = new WeakMap<Document, NativeModalScrollState>();
const observedDialogs = new WeakSet<HTMLDialogElement>();
const modalActivations = new WeakMap<
  Document,
  { button: HTMLButtonElement; dialog: HTMLDialogElement; focus: Element | null }
>();

function observeModalActivation(dialog: HTMLDialogElement): void {
  const document = dialog.ownerDocument;
  const view = document.defaultView;
  if (!view || observedDialogs.has(dialog)) return;
  observedDialogs.add(dialog);
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.detail === 0 || !dialog.matches(':modal')) return;
      const button = event.composedPath().find((target) => target instanceof view.HTMLButtonElement);
      if (!button || button.disabled || button.closest('dialog') !== dialog) return;

      // WebKit can leave the dialog focused when a button inside it is clicked.
      const activation = { button, dialog, focus: document.activeElement };
      modalActivations.set(document, activation);
      // Allow a controlled modal to open in a microtask triggered by this click.
      view.setTimeout(() => {
        if (modalActivations.get(document) === activation) modalActivations.delete(document);
      }, 0);
    },
    true,
  );
}

export function cmModalReturnFocus(dialog: HTMLDialogElement): HTMLElement | null {
  const document = dialog.ownerDocument;
  const active = document.activeElement;
  const activation = modalActivations.get(document);
  if (
    activation &&
    activation.focus === active &&
    activation.button.isConnected &&
    activation.dialog.matches(':modal') &&
    !dialog.contains(activation.button)
  ) {
    modalActivations.delete(document);
    return activation.button;
  }
  const HTMLElementConstructor = document.defaultView?.HTMLElement;
  return HTMLElementConstructor && active instanceof HTMLElementConstructor ? active : null;
}

const focusRowSelector = 'tr, [role="row"], li';
const unavailableFocusSelector = '[hidden], [inert], [aria-hidden="true"]';

function focusRowIdentity(row: Element | null): string | undefined {
  const tableId = row?.getAttribute('data-cm-data-table-row');
  if (tableId) return `table:${tableId}`;
  return row?.id ? `dom:${row.id}` : undefined;
}

function captureDrawerRows(drawer: HTMLDialogElement, row: Element) {
  const group = row.parentElement;
  if (!group || !drawer.contains(group)) return;
  const rows = Array.from(group.children).filter((child) => child.matches(focusRowSelector));
  const index = rows.indexOf(row);
  const neighbors = [...rows.slice(index + 1), ...rows.slice(0, index).reverse()].map((element) => ({
    element,
    identity: focusRowIdentity(element),
  }));
  const path: { element: Element; index: number; following: Element | null }[] = [];
  for (let element: Element = group; element !== drawer && element.parentElement; element = element.parentElement) {
    path.unshift({
      element,
      index: Array.from(element.parentElement.children).indexOf(element),
      following: element.nextElementSibling,
    });
  }

  return () => {
    // A complete render can replace the group as well as its rows.
    let currentGroup: Element = drawer;
    for (const { element, index, following } of path) {
      const replacement =
        element.parentElement === currentGroup
          ? element
          : element.id
            ? drawer.ownerDocument.getElementById(element.id)
            : currentGroup.children.item(index);
      if (
        !replacement ||
        replacement === following ||
        replacement.parentElement !== currentGroup ||
        replacement.tagName !== element.tagName ||
        replacement.getAttribute('role') !== element.getAttribute('role')
      ) {
        return neighbors
          .filter(
            ({ element, identity }) => element.closest('dialog') === drawer && focusRowIdentity(element) === identity,
          )
          .map(({ element }) => element);
      }
      currentGroup = replacement;
    }
    const renderedRows = Array.from(currentGroup.children).filter((child) => child.matches(focusRowSelector));
    const rendered = new Set(renderedRows);
    const rowsByIdentity = new Map(
      renderedRows.flatMap((element) => {
        const identity = focusRowIdentity(element);
        return identity ? [[identity, element] as const] : [];
      }),
    );
    // Resolve the original neighbors in their original order, even if the list has been sorted again.
    const matchedRows = neighbors
      .map(({ element, identity }) => {
        if (identity) return rowsByIdentity.get(identity);
        return rendered.has(element) ? element : undefined;
      })
      .filter((element) => element !== undefined);
    if (matchedRows.length > 0) return matchedRows;
    return [...renderedRows.slice(index), ...renderedRows.slice(0, index).reverse()];
  };
}

export function captureCmModalFocus(dialog: HTMLDialogElement) {
  const opener = cmModalReturnFocus(dialog);
  if (!opener || dialog.contains(opener)) return null;

  const parent = opener.closest('dialog');
  const drawer = parent?.classList.contains('cm-drawer') ? parent : null;
  const row = opener.closest(focusRowSelector);
  const openerRowIdentity = drawer ? focusRowIdentity(row) : undefined;
  const resolveRows = drawer && row ? captureDrawerRows(drawer, row) : undefined;

  return {
    drawer,
    restore() {
      if (
        opener.isConnected &&
        (!openerRowIdentity || focusRowIdentity(opener.closest(focusRowSelector)) === openerRowIdentity)
      ) {
        opener.focus();
        return;
      }
      if (!drawer?.isConnected || !drawer.open) return;
      const rows = (resolveRows?.() ?? []).filter(
        (row) => row.closest('dialog') === drawer && !row.closest(unavailableFocusSelector),
      );
      for (const row of rows) {
        for (const button of row.querySelectorAll<HTMLButtonElement>('button:not(:disabled, [aria-disabled="true"])')) {
          if (button.closest('dialog') !== drawer || button.closest(focusRowSelector) !== row) continue;
          if (button.closest(unavailableFocusSelector)) continue;
          button.focus();
          if (drawer.ownerDocument.activeElement === button) return;
        }
      }

      // A remaining row is a useful focus target even when it has no available action.
      const HTMLElementConstructor = drawer.ownerDocument.defaultView?.HTMLElement;
      for (const row of rows) {
        if (!HTMLElementConstructor || !(row instanceof HTMLElementConstructor)) continue;
        const temporaryTabIndex = !row.hasAttribute('tabindex');
        if (temporaryTabIndex) row.tabIndex = -1;
        row.focus();
        if (drawer.ownerDocument.activeElement === row) {
          if (temporaryTabIndex) row.addEventListener('blur', () => row.removeAttribute('tabindex'), { once: true });
          return;
        }
        if (temporaryTabIndex) row.removeAttribute('tabindex');
      }
      drawer.focus();
    },
  };
}

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
  observeModalActivation(dialog);
  return release;
}
