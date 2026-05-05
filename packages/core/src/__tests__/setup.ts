import { afterEach, beforeEach, vi } from 'vitest';
import { buildThemeCssArtifacts } from '../../build/theme-css-artifacts';

buildThemeCssArtifacts();

vi.mock('@codemonster-ru/vueforge-icons', () => ({
  VueIconify: {
    name: 'VueIconifyStub',
    template: '<span class="vf-icon" aria-hidden="true" />',
  },
  icons: {
    chevronDown: 'chevronDown',
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-vf-theme');

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
