import { describe, expect, it } from 'vitest';

import {
  applyShowcaseTheme,
  bootstrapShowcaseTheme,
  buildPathForSection,
  resolveInitialTheme,
  resolveSectionFromPath,
  shouldHandleShowcaseNavigation,
  showcaseThemeStorageKey,
} from './app-shell';

function createRoot(initial: Record<string, string> = {}) {
  const attributes = new Map(Object.entries(initial));

  return {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    attributes,
  };
}

describe('showcase app shell', () => {
  it('resolves supported section paths and falls back to core', () => {
    expect(resolveSectionFromPath('/layouts/')).toBe('layouts');
    expect(resolveSectionFromPath('/nested/playground')).toBe('playground');
    expect(resolveSectionFromPath('/unknown')).toBe('core');
    expect(buildPathForSection('icons')).toBe('/icons');
  });

  it('handles ordinary primary-button navigation without hijacking modified links', () => {
    const ordinaryClick = {
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    };

    expect(shouldHandleShowcaseNavigation(ordinaryClick)).toBe(true);
    expect(shouldHandleShowcaseNavigation({ ...ordinaryClick, ctrlKey: true })).toBe(false);
    expect(shouldHandleShowcaseNavigation({ ...ordinaryClick, button: 1 })).toBe(false);
    expect(shouldHandleShowcaseNavigation({ ...ordinaryClick, defaultPrevented: true })).toBe(false);
  });

  it('prefers persisted and authored themes before the system fallback', () => {
    expect(resolveInitialTheme('dark', 'light', false)).toBe('dark');
    expect(resolveInitialTheme(null, 'dark', false)).toBe('dark');
    expect(resolveInitialTheme('system', null, true)).toBe('dark');
  });

  it('mirrors the resolved theme for CodeMonster UI and retained VueForge products', () => {
    const root = createRoot();
    applyShowcaseTheme(root, 'dark');

    expect(root.attributes.get('data-cm-theme')).toBe('dark');
    expect(root.attributes.get('data-vf-theme')).toBe('dark');
  });

  it('bootstraps from the existing storage key', () => {
    const root = createRoot();
    const storage = {
      getItem: (key: string) => (key === showcaseThemeStorageKey ? 'dark' : null),
      setItem: () => undefined,
    };

    expect(bootstrapShowcaseTheme(root, storage, false)).toBe('dark');
    expect(root.attributes.get('data-cm-theme')).toBe('dark');
    expect(root.attributes.get('data-vf-theme')).toBe('dark');
  });
});
