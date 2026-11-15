const shellSelector = '[data-cm-controller~="app-shell"], [data-cm-controller~="admin-layout"]';

export function belongsToShell(root: Element, target: Element): boolean {
  const nearest = target.closest(shellSelector);
  return root.contains(target) && (!nearest || nearest === root || !root.contains(nearest));
}

export function findShellControl(root: Element, selector: string): HTMLElement | undefined {
  return [...root.querySelectorAll<HTMLElement>(selector)].find((element) => belongsToShell(root, element));
}
