// What Vue's unmount does for a component inside content that goes away, for
// the Razor controllers that hold state outside their own root.
//
// A Razor controller lives as long as the page, and most need nothing more:
// when a host drops the markup, the listeners on it go with it. An overlay is
// different. Its open panel sits in <body>, its entry sits on the page-wide
// Escape stack, and its outside-click listener sits on the document - none of
// which leaves with the markup. In the reference a VfDropdown open inside a
// VfPopover is unmounted when the popover closes: the menu leaves <body> and
// the entry leaves the stack at once. A popover closed with Enter gives the
// dropdown no outside click, so without this the Razor menu would stay on the
// page and the next Escape would go to a dropdown nobody can see.
//
// Deliberately two functions and no lifecycle: a controller that holds
// document state registers what undoes it, keyed by its own root, and a host
// that unmounts content disposes what is registered inside it. Disposal is
// once per root - the entry is deleted before it runs - so a second call, a
// nested host disposing the same subtree, or a double bootstrap can never run
// it twice, and nothing outside the container is touched.
const disposers = new WeakMap<Element, () => void>();

export function registerDisposal(root: Element, dispose: () => void): void {
  disposers.set(root, dispose);
}

export function disposeWithin(container: ParentNode): void {
  for (const root of container.querySelectorAll('[data-vf-razor]')) {
    const dispose = disposers.get(root);
    if (!dispose) continue;
    disposers.delete(root);
    dispose();
  }
}
