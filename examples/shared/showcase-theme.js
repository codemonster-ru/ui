const themeKey = 'cm-showcase-theme';

export function readShowcaseTheme() {
  const mode = localStorage.getItem(themeKey);
  return mode === 'dark' || mode === 'system' ? mode : 'light';
}

/** @param {'light' | 'dark' | 'system'} mode */
export function applyShowcaseTheme(mode) {
  document.documentElement.dataset.cmTheme = mode;
}

/** @param {'light' | 'dark' | 'system'} mode */
export function saveShowcaseTheme(mode) {
  applyShowcaseTheme(mode);
  if (readShowcaseTheme() !== mode) localStorage.setItem(themeKey, mode);
}

/** @param {(mode: 'light' | 'dark' | 'system') => void} sync */
export function followShowcaseTheme(sync) {
  const update = () => {
    const mode = readShowcaseTheme();
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
