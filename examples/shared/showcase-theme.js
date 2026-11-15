export const showcaseThemeStorageKey = 'cm-showcase-theme';

export function readShowcaseTheme(fallback = 'light') {
  try {
    const mode = localStorage.getItem(showcaseThemeStorageKey);
    return mode === 'light' || mode === 'dark' || mode === 'system' ? mode : fallback;
  } catch {
    return fallback;
  }
}

/** @param {'light' | 'dark' | 'system'} mode */
export function applyShowcaseTheme(mode) {
  document.documentElement.dataset.cmTheme = mode;
}

/** @param {'light' | 'dark' | 'system'} mode */
export function saveShowcaseTheme(mode) {
  applyShowcaseTheme(mode);
  try {
    if (localStorage.getItem(showcaseThemeStorageKey) !== mode) localStorage.setItem(showcaseThemeStorageKey, mode);
  } catch {
    // Theme controls still work for the current page without storage access.
  }
}

/** @param {(mode: 'light' | 'dark' | 'system') => void} sync */
export function followShowcaseTheme(sync, fallback) {
  const update = () => {
    const mode = readShowcaseTheme(fallback);
    applyShowcaseTheme(mode);
    sync(mode);
  };
  const onStorage = (event) => {
    if (event.key === showcaseThemeStorageKey || event.key === null) update();
  };
  update();
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
