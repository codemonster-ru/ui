import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

import { renderBrowserHtml, runInIframe } from '../src/runtimes/browserRuntime';

type WorkerMessageListener = (event: MessageEvent) => void;

class TypeScriptWorkerStub {
  private readonly messageListeners = new Set<WorkerMessageListener>();

  addEventListener(type: string, listener: WorkerMessageListener): void {
    if (type === 'message') {
      this.messageListeners.add(listener);
    }
  }

  postMessage(request: { type: string; id: number; sources: string[] }): void {
    const outputs = request.sources.map((source) =>
      ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
        },
      }).outputText,
    );
    queueMicrotask(() => {
      for (const listener of this.messageListeners) {
        listener({ data: { type: 'result', id: request.id, outputs } } as MessageEvent);
      }
    });
  }

  terminate(): void {}
}

beforeAll(() => {
  vi.stubGlobal('Worker', TypeScriptWorkerStub);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('renderBrowserHtml', () => {
  it('handles local css imports without ESM css loading', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "import './styles.css'; console.log('ok');",
        '/styles.css': '.app{color:red;}',
      },
      '/main.js',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectStyle');
  });

  it('handles external css imports as stylesheet links', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "import 'https://cdn.example.com/theme.css'; console.log('ok');",
      },
      '/main.js',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectLink');
  });

  it('resolves bare imports for vue framework via default resolver', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "import { createApp } from 'vue'; console.log(createApp);",
      },
      '/main.js',
      { framework: 'vue' },
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('https://esm.sh/vue');
  });

  it('uses custom resolveImport hook', async () => {
    const rendered = await renderBrowserHtml(
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

  it('renders entry module inline', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "console.log('ok');",
      },
      '/main.js',
    );

    expect(rendered.html).toContain('<script type="module">console.log(\'ok\');</script>');
  });

  it('transpiles TypeScript modules on demand', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.ts': "const message: string = 'ok'; console.log(message);",
      },
      '/main.ts',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain("const message = 'ok';");
    expect(rendered.html).not.toContain('message: string');
  });

  it('transpiles inline TypeScript scripts on demand', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/index.html': '<html><body><script type="text/typescript">const count: number = 1;</script></body></html>',
      },
      '/index.html',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('<script>const count = 1;');
    expect(rendered.html).not.toContain('type="text/typescript"');
  });

  it('rewrites local re-export specifiers to compiled module URLs', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "export { value } from './feature.js';",
        '/feature.js': 'export const value = 42;',
      },
      '/main.js',
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain("export { value } from 'data:text/javascript;base64,");
    expect(rendered.html).not.toContain("from './feature.js'");
  });

  it('injects a theme bridge for opaque sandbox previews', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/index.html': '<!doctype html><html><head></head><body></body></html>',
      },
      '/index.html',
    );

    expect(rendered.html).toContain("message.type !== 'theme'");
    expect(rendered.html).toContain("root.setAttribute('data-vf-theme', theme)");
    expect(rendered.html).toContain('event.source !== parent');
    expect(rendered.html).toContain("propertyName.startsWith('--vf-')");
    expect(rendered.html).toContain('collectThemeVariable(propertyName, variables, acceptedVariables)');
    expect(rendered.html).toContain('root.style.removeProperty(propertyName)');
    expect(rendered.html).toContain('root.style.setProperty(propertyName, acceptedVariables[propertyName])');
  });

  it('applies sandbox theme messages and removes stale variables', async () => {
    const rendered = await renderBrowserHtml(
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

    expect(attributes.get('data-vf-theme')).toBe('light');
    expect(classes.has('light')).toBe(true);
    expect(classes.has('dark')).toBe(false);
    expect(rootStyle.colorScheme).toBe('light');
    expect(variables.get('--vf-first')).toBe('var(--brand-first)');
    expect(variables.get('--brand-first')).toBe('var(--brand-base)');
    expect(variables.get('--brand-base')).toBe('first-value');
    expect(variables.has('--not-vf')).toBe(false);
    expect(bodyStyle.backgroundColor).toBe('var(--vf-color-background-canvas, Canvas)');
    expect(bodyStyle.color).toBe('var(--vf-color-text-primary, CanvasText)');

    handleMessage?.({
      source: parentWindow,
      data: {
        __cm_playground: true,
        type: 'theme',
        payload: { theme: 'dark', variables: { '--vf-second': 'second-value' } },
      },
    });

    expect(attributes.get('data-vf-theme')).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(classes.has('light')).toBe(false);
    expect(rootStyle.colorScheme).toBe('dark');
    expect(variables.has('--vf-first')).toBe(false);
    expect(variables.has('--brand-first')).toBe(false);
    expect(variables.has('--brand-base')).toBe(false);
    expect(variables.get('--vf-second')).toBe('second-value');
  });

  it('keeps iframe previews script-only sandboxed', async () => {
    const iframe = { setAttribute: vi.fn(), srcdoc: '' } as unknown as HTMLIFrameElement;

    runInIframe(iframe, '<!doctype html><html><body></body></html>');

    expect(iframe.setAttribute).toHaveBeenCalledWith('sandbox', 'allow-scripts');
    expect(iframe.srcdoc).toContain('<body>');
  });

  it('returns clear unresolved import error', async () => {
    const rendered = await renderBrowserHtml(
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

  it('returns a deterministic error for a direct circular import', async () => {
    const rendered = await renderBrowserHtml(
      {
        '/main.js': "import './main.js'; console.log('unreachable');",
      },
      '/main.js',
    );

    expect(rendered.error).toEqual({
      message: 'Circular import detected: /main.js -> /main.js',
      source: 'runtime',
      code: 'circular',
      details: {
        specifier: '/main.js',
        fromFile: '/main.js',
        reason: 'circular',
      },
    });
  });

  it('returns a deterministic error for an indirect circular import', async () => {
    const files = {
      '/main.js': "import './feature.js'; console.log('main');",
      '/feature.js': "import './main.js'; console.log('feature');",
    };

    const first = await renderBrowserHtml(files, '/main.js');
    const second = await renderBrowserHtml(files, '/main.js');

    expect(first.error).toEqual({
      message: 'Circular import detected: /main.js -> /feature.js -> /main.js',
      source: 'runtime',
      code: 'circular',
      details: {
        specifier: '/main.js',
        fromFile: '/feature.js',
        reason: 'circular',
      },
    });
    expect(second.error).toEqual(first.error);
  });
});
