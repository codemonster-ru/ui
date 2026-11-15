export function releaseCmOverlayFocus(panel: HTMLElement): void {
  const focused = (panel.getRootNode() as Document | ShadowRoot).activeElement as HTMLElement | null;
  if (panel.contains(focused)) focused?.blur();
}
