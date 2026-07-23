import { createApp, defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import VfCodeBlockPlugin, { setCodeBlockThemeVars } from '../index';
import { __getCodeBlockLanguageLoadAttemptsForTests } from '../services/code-highlight';

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
          '--vf-codeblock-dark-background-color': 'var(--vf-color-background-surface)',
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement).not.toBeNull();
    expect(styleElement?.textContent).toContain('--vf-codeblock-border-radius: var(--vf-radius-surface);');
    expect(styleElement?.textContent).toContain('--vf-codeblock-padding: var(--vf-surface-padding);');
    expect(styleElement?.textContent).toContain(
      '--vf-codeblock-dark-background-color: var(--vf-color-background-surface);',
    );

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
          '--vf-codeblock-background-color': 'var(--vf-color-background-surface)',
        },
        dark: {
          '--vf-codeblock-dark-background-color': 'var(--vf-color-background-surface)',
        },
      },
    });
    app.mount(host);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.textContent).toContain(':is(#docs-app):where([data-vf-theme="light"])');
    expect(styleElement?.textContent).toContain(':is(#docs-app):where([data-vf-theme="dark"])');
    expect(styleElement?.textContent).toContain(':where([data-vf-theme="light"]) :is(#docs-app)');
    expect(styleElement?.textContent).toContain(':where([data-vf-theme="dark"]) :is(#docs-app)');
    expect(styleElement?.textContent).toContain(':where(#docs-app) :where([data-vf-theme="light"])');
    expect(styleElement?.textContent).toContain(':where(#docs-app) :where([data-vf-theme="dark"])');
    expect(styleElement?.textContent).not.toContain('data-theme=');

    app.unmount();
  });

  it('supports selector-list scopes while preserving component-local variable overrides', () => {
    const lightScope = document.createElement('div');
    lightScope.id = 'docs-light';
    lightScope.setAttribute('data-vf-theme', 'light');
    const localCodeBlock = document.createElement('div');
    localCodeBlock.className = 'vf-codeblock';
    localCodeBlock.setAttribute('data-vf-theme', 'light');
    lightScope.appendChild(localCodeBlock);

    const darkBoundary = document.createElement('div');
    darkBoundary.setAttribute('data-vf-theme', 'dark');
    const darkScope = document.createElement('div');
    darkScope.id = 'docs-dark';
    darkBoundary.appendChild(darkScope);
    document.body.append(lightScope, darkBoundary);

    setCodeBlockThemeVars(
      {
        base: { '--vf-codeblock-cascade-probe': 'base' },
        light: { '--vf-codeblock-cascade-probe': 'light' },
        dark: { '--vf-codeblock-cascade-probe': 'dark' },
      },
      { themeScope: '#docs-light, #docs-dark' },
    );

    const localOverrides = document.createElement('style');
    localOverrides.textContent = '.vf-codeblock { --vf-codeblock-cascade-probe: local; }';
    document.head.appendChild(localOverrides);

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.textContent).toContain(':is(#docs-light, #docs-dark)');
    expect(getComputedStyle(lightScope).getPropertyValue('--vf-codeblock-cascade-probe').trim()).toBe('light');
    expect(getComputedStyle(darkScope).getPropertyValue('--vf-codeblock-cascade-probe').trim()).toBe('dark');
    expect(getComputedStyle(localCodeBlock).getPropertyValue('--vf-codeblock-cascade-probe').trim()).toBe('local');

    localOverrides.remove();
    lightScope.remove();
    darkBoundary.remove();
  });

  it('reapplies base-only theme vars on local mode boundaries without defeating local overrides', () => {
    document.getElementById('vf-codeblock-runtime-theme-vars')?.remove();

    const tokenDefaults = document.createElement('style');
    tokenDefaults.textContent = readFileSync(resolve(__dirname, '../tokens.css'), 'utf8');
    document.head.appendChild(tokenDefaults);

    const scope = document.createElement('div');
    scope.id = 'base-only-scope';
    scope.style.setProperty('--vf-color-background-surface-subtle', 'token-default');
    const codeBlock = document.createElement('div');
    codeBlock.className = 'vf-codeblock';
    codeBlock.setAttribute('data-vf-theme', 'light');
    scope.appendChild(codeBlock);
    document.body.appendChild(scope);

    setCodeBlockThemeVars(
      { base: { '--vf-codeblock-background-color': 'plugin-base' } },
      { themeScope: '#base-only-scope' },
    );

    const styleElement = document.getElementById('vf-codeblock-runtime-theme-vars');
    expect(styleElement?.textContent?.match(/--vf-codeblock-background-color: plugin-base;/g)).toHaveLength(3);
    expect(getComputedStyle(codeBlock).getPropertyValue('--vf-codeblock-background-color').trim()).toBe('plugin-base');

    codeBlock.setAttribute('data-vf-theme', 'dark');
    expect(getComputedStyle(codeBlock).getPropertyValue('--vf-codeblock-background-color').trim()).toBe('plugin-base');

    const localOverrides = document.createElement('style');
    localOverrides.textContent = '.vf-codeblock { --vf-codeblock-background-color: local; }';
    document.head.appendChild(localOverrides);
    expect(getComputedStyle(codeBlock).getPropertyValue('--vf-codeblock-background-color').trim()).toBe('local');

    localOverrides.remove();
    tokenDefaults.remove();
    styleElement?.remove();
    scope.remove();
  });

  it('preserves inherited public token overrides for inherit-mode components', () => {
    const tokenDefaults = document.createElement('style');
    tokenDefaults.textContent = readFileSync(resolve(__dirname, '../tokens.css'), 'utf8');
    document.head.appendChild(tokenDefaults);

    const scope = document.createElement('div');
    scope.className = 'brand-scope';
    const codeBlock = document.createElement('div');
    codeBlock.className = 'vf-codeblock';
    codeBlock.setAttribute('data-vf-theme', 'inherit');
    scope.appendChild(codeBlock);
    document.body.appendChild(scope);

    expect(tokenDefaults.textContent).not.toContain('[data-theme=');
    expect(codeBlock.matches(":where([data-vf-theme='light'], [data-vf-theme='dark'])")).toBe(false);
    expect(codeBlock.getAttribute('data-vf-theme')).toBe('inherit');
    expect(scope.matches('.brand-scope')).toBe(true);

    scope.style.setProperty('--vf-codeblock-background-color', 'inherited-brand');
    expect(scope.style.getPropertyValue('--vf-codeblock-background-color')).toBe('inherited-brand');

    scope.remove();
    tokenDefaults.remove();
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

  it('starts language preload on plugin install', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const app = createApp(TestHostComponent);
    app.use(VfCodeBlockPlugin, {
      allowedLanguages: ['ts', 'json'],
      preloadLanguages: ['ts', 'bash', 'json'],
    });
    app.mount(host);
    for (let index = 0; index < 20; index += 1) {
      if (__getCodeBlockLanguageLoadAttemptsForTests('ts') > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(__getCodeBlockLanguageLoadAttemptsForTests('ts')).toBeGreaterThan(0);
    app.unmount();
  });
});
