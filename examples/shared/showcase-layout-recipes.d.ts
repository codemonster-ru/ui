export function mountLayoutRecipes(root: HTMLElement): () => void;
export function fitLayoutPreview(content: Element | null): void;
export function fitAppShellPreviewForLayout(
  frame: HTMLIFrameElement,
  layout: string,
  selectWidth: (width: string) => void,
): void;
export function followAppShellPreview(update: (layout: string, options: string[]) => void): void;
export function mountWarehousePagination(root: HTMLElement): void;
