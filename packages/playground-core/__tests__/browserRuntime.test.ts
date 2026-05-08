import { describe, expect, it } from 'vitest';

import { renderBrowserHtml } from '../src/runtimes/browserRuntime';

describe('renderBrowserHtml', () => {
  it('handles local css imports without ESM css loading', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import './styles.css'; console.log('ok');",
        '/styles.css': '.app{color:red;}'
      },
      '/main.js'
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectStyle');
  });

  it('handles external css imports as stylesheet links', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import 'https://cdn.example.com/theme.css'; console.log('ok');"
      },
      '/main.js'
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('__cmInjectLink');
  });

  it('resolves bare imports for vue framework via default resolver', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { createApp } from 'vue'; console.log(createApp);"
      },
      '/main.js',
      { framework: 'vue' }
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('https://esm.sh/vue');
  });

  it('uses custom resolveImport hook', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { x } from 'my-lib'; import 'my-lib/styles.css'; console.log(x);"
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
        }
      }
    );

    expect(rendered.error).toBeUndefined();
    expect(rendered.html).toContain('https://cdn.example.com/my-lib.js');
    expect(rendered.html).toContain('https://cdn.example.com/my-lib.css');
  });

  it('renders entry module inline', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "console.log('ok');"
      },
      '/main.js'
    );

    expect(rendered.html).toContain("<script type=\"module\">console.log('ok');</script>");
  });

  it('returns clear unresolved import error', () => {
    const rendered = renderBrowserHtml(
      {
        '/main.js': "import { x } from 'unknown-lib'; console.log(x);"
      },
      '/main.js',
      { framework: 'vanilla' }
    );

    expect(rendered.error).toBeDefined();
    expect(rendered.error?.code).toBe('unresolved');
    expect(rendered.error?.details?.specifier).toBe('unknown-lib');
    expect(rendered.error?.details?.fromFile).toBe('/main.js');
  });
});
