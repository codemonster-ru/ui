import { createApp, defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import VfCodeBlockPlugin, { setCodeBlockThemeVars } from '../index';

const TestHostComponent = defineComponent({
  render() {
    return h('div');
  },
});

describe('VfCodeBlockPlugin plugin', () => {
  it('injects runtime theme vars via plugin options', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VfCodeBlockPlugin, {
      themeVars: {
        base: {
          '--vf-codeblock-border-radius': 'var(--vf-radius-surface)',
          '--vf-codeblock-padding': 'var(--vf-surface-padding)',
        },
        dark: {
          '--vf-codeblock-dark-background-color': 'var(--vf-color-surface)',
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement).not.toBeNull();
    expect(styleElement?.textContent).toContain('--vf-codeblock-border-radius: var(--vf-radius-surface);');
    expect(styleElement?.textContent).toContain('--vf-codeblock-padding: var(--vf-surface-padding);');
    expect(styleElement?.textContent).toContain('--vf-codeblock-dark-background-color: var(--vf-color-surface);');

    app.unmount();
  });

  it('uses scoped selectors for light and dark theme vars', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VfCodeBlockPlugin, {
      themeScope: '#docs-app',
      themeVars: {
        light: {
          '--vf-codeblock-background-color': 'var(--vf-color-surface)',
        },
        dark: {
          '--vf-codeblock-dark-background-color': 'var(--vf-color-surface)',
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.textContent).toContain('#docs-app[data-theme="light"], #docs-app[data-vf-theme="light"]');
    expect(styleElement?.textContent).toContain('#docs-app[data-theme="dark"], #docs-app[data-vf-theme="dark"]');

    app.unmount();
  });

  it('is safe when document is unavailable', () => {
    vi.stubGlobal('document', undefined);

    const app = createApp(TestHostComponent);

    expect(() => {
      app.use(VfCodeBlockPlugin, {
        themeVars: {
          base: { '--vf-codeblock-padding': 'var(--vf-surface-padding)' },
        },
      });
    }).not.toThrow();

    vi.unstubAllGlobals();
  });

  it('sets nonce on runtime style tag', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);

    app.use(VfCodeBlockPlugin, {
      styleNonce: 'nonce-123',
      themeVars: {
        base: { '--vf-codeblock-padding': 'var(--vf-surface-padding)' },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.getAttribute('nonce')).toBe('nonce-123');

    app.unmount();
  });

  it('updates runtime theme vars via setCodeBlockThemeVars helper', () => {
    setCodeBlockThemeVars({
      base: {
        '--vf-codeblock-padding': 'calc(var(--vf-surface-padding) * 2)',
      },
    });

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.textContent).toContain('--vf-codeblock-padding: calc(var(--vf-surface-padding) * 2);');
  });
});
