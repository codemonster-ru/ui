const themeKey = 'cm-showcase-theme';

export function readShowcaseTheme(fallback = 'light') {
  const mode = localStorage.getItem(themeKey);
  return mode === 'light' || mode === 'dark' || mode === 'system' ? mode : fallback;
}

/** @param {'light' | 'dark' | 'system'} mode */
export function applyShowcaseTheme(mode) {
  document.documentElement.dataset.cmTheme = mode;
}

/** @param {'light' | 'dark' | 'system'} mode */
export function saveShowcaseTheme(mode) {
  applyShowcaseTheme(mode);
  if (localStorage.getItem(themeKey) !== mode) localStorage.setItem(themeKey, mode);
}

/** @param {(mode: 'light' | 'dark' | 'system') => void} sync */
export function followShowcaseTheme(sync, fallback) {
  const update = () => {
    const mode = readShowcaseTheme(fallback);
    applyShowcaseTheme(mode);
    sync(mode);
  };
  const onStorage = (event) => {
    if (event.key === themeKey || event.key === null) update();
  };
  update();
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
