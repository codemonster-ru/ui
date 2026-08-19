// @vitest-environment jsdom

import { createApp, defineComponent, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { showcaseThemeStorageKey } from './app-shell';
import { provideShowcaseTheme, type ShowcaseThemeContext } from './showcase-theme';

interface MutableMediaQueryList extends MediaQueryList {
  dispatch(matches: boolean): void;
}

function createMediaQueryList(initialMatches: boolean): MutableMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;

  return {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
      listeners.add(listener as (event: MediaQueryListEvent) => void),
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
      listeners.delete(listener as (event: MediaQueryListEvent) => void),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
    dispatch(nextMatches) {
      matches = nextMatches;
      const event = { matches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('showcase theme context', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    document.documentElement.removeAttribute('data-cm-theme');
    document.documentElement.removeAttribute('data-vf-theme');
    document.documentElement.classList.remove('vf-theme-transitioning');
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    host.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('persists mode, resolves system changes, and owns both product attributes', async () => {
    const mediaQuery = createMediaQueryList(false);
    vi.stubGlobal('matchMedia', () => mediaQuery);
    window.localStorage.setItem(showcaseThemeStorageKey, 'system');
    let theme: ShowcaseThemeContext | undefined;
    const app = createApp(
      defineComponent({
        setup() {
          theme = provideShowcaseTheme();
          return () => null;
        },
      }),
    );

    app.mount(host);
    expect(theme?.themeMode.value).toBe('system');
    expect(theme?.resolvedTheme.value).toBe('light');
    expect(document.documentElement.getAttribute('data-cm-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('light');

    mediaQuery.dispatch(true);
    await nextTick();
    expect(theme?.resolvedTheme.value).toBe('dark');
    expect(document.documentElement.getAttribute('data-cm-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('vf-theme-transitioning')).toBe(true);

    theme?.setThemeMode('light');
    await nextTick();
    expect(window.localStorage.getItem(showcaseThemeStorageKey)).toBe('light');
    expect(theme?.resolvedTheme.value).toBe('light');

    vi.advanceTimersByTime(320);
    expect(document.documentElement.classList.contains('vf-theme-transitioning')).toBe(false);
    app.unmount();
  });
});
