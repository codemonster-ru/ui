export function mountLayoutRecipes(root: HTMLElement): () => void;
export function revealLayoutPreview(content: Element | null): Promise<void>;
export function enableAuthPreview(form: HTMLFormElement | null): void;
export function fitShellPreviewForLayout(
  frame: HTMLIFrameElement,
  layout: string,
  selectWidth: (width: string) => void,
): void;
export function followShellPreview(
  slug: 'app-shell' | 'document-layout',
  update: (layout: string, options: string[]) => void,
): void;
export function mountWarehousePagination(root: HTMLElement): void;
