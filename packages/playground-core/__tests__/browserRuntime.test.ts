import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';

import { renderBrowserHtml, runInIframe } from '../src/runtimes/browserRuntime';

describe('renderBrowserHtml', () => {
  it('handles local css imports without ESM css loading', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import './styles.css'; console.log('ok');",
        '/styles.css': '.app{color:red;}',
      },
      '/main.js',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectStyle');
  });

  it('handles external css imports as stylesheet links', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import 'https://cdn.example.com/theme.css'; console.log('ok');",
      },
      '/main.js',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectLink');
  });

  it('resolves bare imports for vue framework via default resolver', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { createApp } from 'vue'; console.log(createApp);",
      },
      '/main.js',
      { framework: 'vue' },
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('https://esm.sh/vue');
  });

  it('uses custom resolveImport hook', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { x } from 'my-lib'; import 'my-lib/styles.css'; console.log(x);",
      },
      '/main.js',
      {
        resolveImport(specifier) {
          if (specifier === 'my-lib') {
            return { kind: 'module', url: 'https://cdn.example.com/my-lib.js' };
          }
          if (specifier === 'my-lib/styles.css') {
            return { kind: 'style', url: 'https://cdn.example.com/my-lib.css' };
          }
          return null;
        },
      },
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('https://cdn.example.com/my-lib.js');
    expect(rendered.html).toContain('https://cdn.example.com/my-lib.css');
  });

  it('renders entry module inline', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "console.log('ok');",
      },
      '/main.js',
    );

    expect(rendered.html).toContain('<script type="module">console.log(\'ok\');</script>');
  });

  it('injects a theme bridge for opaque sandbox previews', () => {
    const rendered = renderBrowserHtml(
      {
        '/index.html': '<!doctype html><html><head></head><body></body></html>',
      },
      '/index.html',
    );

    expect(rendered.html).toContain("message.type !== 'theme'");
    expect(rendered.html).toContain("root.setAttribute('data-theme', theme)");
    expect(rendered.html).toContain("root.setAttribute('data-vf-theme', theme)");
    expect(rendered.html).toContain('event.source !== parent');
    expect(rendered.html).toContain("propertyName.startsWith('--vf-')");
    expect(rendered.html).toContain('collectThemeVariable(propertyName, variables, acceptedVariables)');
    expect(rendered.html).toContain('root.style.removeProperty(propertyName)');
    expect(rendered.html).toContain('root.style.setProperty(propertyName, acceptedVariables[propertyName])');
  });

  it('applies sandbox theme messages and removes stale variables', () => {
    const rendered = renderBrowserHtml(
      {
        '/index.html': '<!doctype html><html><head></head><body></body></html>',
      },
      '/index.html',
    );
    const bridgeScript = rendered.html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(bridgeScript).toBeTruthy();

    type BridgeEvent = { source: unknown; data: unknown };
    let handleMessage: ((event: BridgeEvent) => void) | undefined;
    const parentWindow = { postMessage: vi.fn() };
    const attributes = new Map<string, string>();
    const classes = new Set<string>();
    const variables = new Map<string, string>();
    const rootStyle = {
      colorScheme: '',
      removeProperty(propertyName: string) {
        variables.delete(propertyName);
      },
      setProperty(propertyName: string, value: string) {
        variables.set(propertyName, value);
      },
    };
    const root = {
      classList: {
        toggle(className: string, force: boolean) {
          if (force) {
            classes.add(className);
          } else {
            classes.delete(className);
          }
        },
      },
      setAttribute(name: string, value: string) {
        attributes.set(name, value);
      },
      style: rootStyle,
    };
    const bodyStyle = { backgroundColor: '', color: '' };
    const windowStub = {
      addEventListener(type: string, listener: (event: BridgeEvent) => void) {
        if (type === 'message') {
          handleMessage = listener;
        }
      },
    };
    const consoleStub = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map((level) => [level, vi.fn()]));

    runInNewContext(bridgeScript as string, {
      console: consoleStub,
      document: { body: { style: bodyStyle }, documentElement: root },
      parent: parentWindow,
      window: windowStub,
    });

    expect(handleMessage).toBeTypeOf('function');
    handleMessage?.({
      source: {},
      data: {
        __cm_playground: true,
        type: 'theme',
        payload: { theme: 'dark', variables: { '--vf-rejected': 'wrong-source' } },
      },
    });
    expect(attributes.size).toBe(0);

    handleMessage?.({
      source: parentWindow,
      data: {
        __cm_playground: true,
        type: 'theme',
        payload: {
          theme: 'light',
          variables: {
            '--vf-first': 'var(--brand-first)',
            '--brand-first': 'var(--brand-base)',
            '--brand-base': 'first-value',
            '--not-vf': 'ignored',
          },
        },
      },
    });

    expect(attributes.get('data-theme')).toBe('light');
    expect(attributes.get('data-vf-theme')).toBe('light');
    expect(classes.has('light')).toBe(true);
    expect(classes.has('dark')).toBe(false);
    expect(rootStyle.colorScheme).toBe('light');
    expect(variables.get('--vf-first')).toBe('var(--brand-first)');
    expect(variables.get('--brand-first')).toBe('var(--brand-base)');
    expect(variables.get('--brand-base')).toBe('first-value');
    expect(variables.has('--not-vf')).toBe(false);
    expect(bodyStyle.backgroundColor).toBe('var(--vf-color-background-canvas, var(--vf-color-bg, Canvas))');
    expect(bodyStyle.color).toBe('var(--vf-color-text-primary, var(--vf-color-text, CanvasText))');

    handleMessage?.({
      source: parentWindow,
      data: {
        __cm_playground: true,
        type: 'theme',
        payload: { theme: 'dark', variables: { '--vf-second': 'second-value' } },
      },
    });

    expect(attributes.get('data-theme')).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(classes.has('light')).toBe(false);
    expect(rootStyle.colorScheme).toBe('dark');
    expect(variables.has('--vf-first')).toBe(false);
    expect(variables.has('--brand-first')).toBe(false);
    expect(variables.has('--brand-base')).toBe(false);
    expect(variables.get('--vf-second')).toBe('second-value');
  });

  it('keeps iframe previews script-only sandboxed', () => {
    const iframe = { setAttribute: vi.fn(), srcdoc: '' } as unknown as HTMLIFrameElement;

    runInIframe(iframe, '<!doctype html><html><body></body></html>');

    expect(iframe.setAttribute).toHaveBeenCalledWith('sandbox', 'allow-scripts');
    expect(iframe.srcdoc).toContain('<body>');
  });

  it('returns clear unresolved import error', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { x } from 'unknown-lib'; console.log(x);",
      },
      '/main.js',
      { framework: 'vanilla' },
    );

    expect(rendered.error).toBeDefined();
    expect(rendered.error?.code).toBe('unresolved');
    expect(rendered.error?.details?.specifier).toBe('unknown-lib');
    expect(rendered.error?.details?.fromFile).toBe('/main.js');
  });
});
