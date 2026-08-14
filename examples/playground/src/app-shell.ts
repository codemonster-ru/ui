export type ShowcaseSection = 'colors' | 'core' | 'layouts' | 'icons' | 'codeblock' | 'playground';
export type ShowcaseTheme = 'light' | 'dark';

const validSections = new Set<ShowcaseSection>([
  'colors',
  'core',
  'layouts',
  'icons',
  'codeblock',
  'playground',
]);

interface ThemeRoot {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const showcaseThemeStorageKey = 'codemonster-showcase-theme';

export function resolveSectionFromPath(pathname: string): ShowcaseSection {
  const normalizedPath = pathname.replace(/\/+$/, '');
  const segments = normalizedPath.split('/').filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : undefined;

  return lastSegment && validSections.has(lastSegment as ShowcaseSection)
    ? (lastSegment as ShowcaseSection)
    : 'core';
}

export function buildPathForSection(section: ShowcaseSection): string {
  return `/${section}`;
}

export function resolveInitialTheme(
  storedTheme: string | null,
  authoredTheme: string | null,
  prefersDark: boolean,
): ShowcaseTheme {
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  if (authoredTheme === 'light' || authoredTheme === 'dark') return authoredTheme;
  return prefersDark ? 'dark' : 'light';
}

export function applyShowcaseTheme(root: ThemeRoot, theme: ShowcaseTheme): void {
  root.setAttribute('data-cm-theme', theme);
  root.setAttribute('data-vf-theme', theme);
}

export function bootstrapShowcaseTheme(
  root: ThemeRoot,
  storage: ThemeStorage,
  prefersDark: boolean,
): ShowcaseTheme {
  let storedTheme: string | null = null;

  try {
    storedTheme = storage.getItem(showcaseThemeStorageKey);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  const theme = resolveInitialTheme(storedTheme, root.getAttribute('data-cm-theme'), prefersDark);
  applyShowcaseTheme(root, theme);
  return theme;
}

export function persistShowcaseTheme(root: ThemeRoot, storage: ThemeStorage, theme: ShowcaseTheme): void {
  applyShowcaseTheme(root, theme);

  try {
    storage.setItem(showcaseThemeStorageKey, theme);
  } catch {
    // The in-page preference still works when persistence is unavailable.
  }
}
