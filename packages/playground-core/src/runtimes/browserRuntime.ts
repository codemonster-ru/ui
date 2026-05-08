import ts from 'typescript';

import type {
  CreatePlaygroundSessionOptions,
  FrameworkType,
  ImportResolutionContext,
  ImportResolutionResult,
  PlaygroundError,
  PlaygroundFiles
} from '../types';

const CONSOLE_BRIDGE_SCRIPT = `
<script>
(function(){
  var levels = ['log','info','warn','error','debug'];
  levels.forEach(function(level){
    var original = console[level];
    console[level] = function(){
      var args = Array.prototype.slice.call(arguments);
      try {
        parent.postMessage({
          __cm_playground: true,
          type: 'console',
          payload: { level: level, args: args, timestamp: Date.now() }
        }, '*');
      } catch (_) {}
      original.apply(console, args);
    };
  });

  window.addEventListener('error', function(event){
    parent.postMessage({
      __cm_playground: true,
      type: 'error',
      payload: {
        message: event.message || 'Runtime error',
        stack: event.error && event.error.stack,
        source: 'runtime'
      }
    }, '*');
  });

  window.addEventListener('unhandledrejection', function(event){
    var reason = event.reason || {};
    parent.postMessage({
      __cm_playground: true,
      type: 'error',
      payload: {
        message: reason.message || String(reason),
        stack: reason.stack,
        source: 'runtime'
      }
    }, '*');
  });
})();
</script>
`;

const STYLE_HELPERS = `
const __cmStyleCache = new Set();
function __cmInjectStyle(cssText, key) {
  if (key && __cmStyleCache.has(key)) return;
  var style = document.createElement('style');
  style.textContent = cssText;
  document.head.appendChild(style);
  if (key) __cmStyleCache.add(key);
}
function __cmInjectLink(href) {
  if (!href || __cmStyleCache.has(href)) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  __cmStyleCache.add(href);
}
`;

function transpileTs(content: string): string {
  return ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext
    }
  }).outputText;
}

function replaceInlineTsScripts(html: string): string {
  return html.replace(
    /<script\s+type=["']text\/typescript["']\s*>([\s\S]*?)<\/script>/gi,
    (_, content: string) => `<script>${transpileTs(content)}</script>`
  );
}

function normalizePath(path: string): string {
  const parts = path.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `/${stack.join('/')}`;
}

function resolveRelativeImportPath(fromFile: string, importPath: string): string {
  if (importPath.startsWith('/')) {
    return normalizePath(importPath);
  }
  const base = fromFile.slice(0, fromFile.lastIndexOf('/') + 1) || '/';
  return normalizePath(`${base}${importPath}`);
}

function isExternalUrl(specifier: string): boolean {
  return /^https?:\/\//i.test(specifier);
}

function isBareImport(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !isExternalUrl(specifier);
}

function isCssPath(path: string): boolean {
  return /\.css(?:\?|#|$)/i.test(path);
}

function stripQuery(path: string): string {
  return path.split('?')[0].split('#')[0];
}

function defaultResolveImport(specifier: string, context: ImportResolutionContext): ImportResolutionResult | null {
  if (isExternalUrl(specifier)) {
    return {
      kind: isCssPath(specifier) ? 'style' : 'module',
      url: specifier
    };
  }

  if (context.framework === 'vue' && isBareImport(specifier)) {
    return {
      kind: isCssPath(specifier) ? 'style' : 'module',
      url: `https://esm.sh/${specifier}`
    };
  }

  return null;
}

function escapeJsString(value: string): string {
  return JSON.stringify(value);
}

function toBase64(value: string): string {
  if (typeof btoa === 'function') {
    const encoded = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
      String.fromCharCode(Number.parseInt(p1, 16))
    );
    return btoa(encoded);
  }

  const nodeBuffer = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(value, 'utf8').toString('base64');
  }

  throw new Error('Base64 encoding is not available in this environment.');
}

interface BuildOptions {
  framework?: FrameworkType;
  resolveImport?: CreatePlaygroundSessionOptions['resolveImport'];
}

interface BuildResult {
  code: string;
  errors: PlaygroundError[];
}

function buildEntryModule(files: PlaygroundFiles, entry: string, options: BuildOptions): BuildResult {
  const visited = new Map<string, string>();
  const moduleUrls = new Map<string, string>();
  const errors: PlaygroundError[] = [];

  const importRegex = /(import\s+(?:[^"'()]+?\s+from\s+)?["']([^"']+)["']\s*;?)|(export\s+[^"']+?\s+from\s+["']([^"']+)["']\s*;?)/g;

  function makeError(
    message: string,
    reason: PlaygroundError['code'],
    specifier: string,
    fromFile: string
  ): PlaygroundError {
    return {
      message,
      source: 'runtime',
      code: reason,
      details: {
        specifier,
        fromFile,
        reason
      }
    };
  }

  function resolveLocalModulePath(path: string): string | null {
    if (typeof files[path] === 'string') {
      return path;
    }

    const candidates = ['.ts', '.js', '.mjs'].map((ext) => `${path}${ext}`);
    if (!path.endsWith('/index')) {
      candidates.push(`${path}/index.ts`, `${path}/index.js`, `${path}/index.mjs`);
    }

    for (const candidate of candidates) {
      if (typeof files[candidate] === 'string') {
        return candidate;
      }
    }

    return null;
  }

  function compileModule(filePath: string): string {
    if (visited.has(filePath)) {
      return visited.get(filePath) as string;
    }

    const source = files[filePath];
    if (typeof source !== 'string') {
      errors.push(
        makeError(`Entry file not found: ${filePath}`, 'unresolved', filePath, filePath)
      );
      const empty = `throw new Error(${escapeJsString(`Entry file not found: ${filePath}`)});`;
      visited.set(filePath, empty);
      return empty;
    }

    const sourceJs = filePath.endsWith('.ts') ? transpileTs(source) : source;
    let usesStyleHelpers = false;

    const transformed = sourceJs.replace(importRegex, (full, importStmt, importSpec, exportStmt, exportSpec) => {
      const specifier = (importSpec ?? exportSpec) as string;
      const isExport = Boolean(exportStmt);

      if (isCssPath(specifier)) {
        const resolvedLocal = isBareImport(specifier)
          ? null
          : resolveRelativeImportPath(filePath, stripQuery(specifier));

        if (resolvedLocal && typeof files[resolvedLocal] === 'string') {
          usesStyleHelpers = true;
          return `__cmInjectStyle(${escapeJsString(files[resolvedLocal])}, ${escapeJsString(resolvedLocal)});`;
        }

        const resolved = options.resolveImport?.(specifier, {
          fromFile: filePath,
          framework: options.framework
        }) ?? defaultResolveImport(specifier, { fromFile: filePath, framework: options.framework });

        if (!resolved || resolved.kind !== 'style') {
          errors.push(
            makeError(
              `Unable to resolve style import "${specifier}" from "${filePath}"`,
              'unresolved',
              specifier,
              filePath
            )
          );
          return `throw new Error(${escapeJsString(
            `Unable to resolve style import "${specifier}" from "${filePath}"`
          )});`;
        }

        usesStyleHelpers = true;
        return `__cmInjectLink(${escapeJsString(resolved.url)});`;
      }

      if (isExternalUrl(specifier)) {
        return full;
      }

      if (!isBareImport(specifier)) {
        const localPath = resolveRelativeImportPath(filePath, specifier);
        const localModulePath = resolveLocalModulePath(stripQuery(localPath));

        if (!localModulePath) {
          errors.push(
            makeError(
              `Unable to resolve import "${specifier}" from "${filePath}"`,
              'unresolved',
              specifier,
              filePath
            )
          );
          return `throw new Error(${escapeJsString(
            `Unable to resolve import "${specifier}" from "${filePath}"`
          )});`;
        }

        const compiled = compileModule(localModulePath);
        const moduleUrl = ensureModuleUrl(localModulePath, compiled);

        if (isExport) {
          return full.replace(specifier, moduleUrl);
        }
        return full.replace(specifier, moduleUrl);
      }

      const resolved = options.resolveImport?.(specifier, {
        fromFile: filePath,
        framework: options.framework
      }) ?? defaultResolveImport(specifier, { fromFile: filePath, framework: options.framework });

      if (!resolved || resolved.kind !== 'module') {
        errors.push(
          makeError(
            `Unable to resolve import "${specifier}" from "${filePath}"`,
            'unresolved',
            specifier,
            filePath
          )
        );
        return `throw new Error(${escapeJsString(
          `Unable to resolve import "${specifier}" from "${filePath}"`
        )});`;
      }

      return full.replace(specifier, resolved.url);
    });

    const withHelpers = usesStyleHelpers ? `${STYLE_HELPERS}\n${transformed}` : transformed;
    visited.set(filePath, withHelpers);
    return withHelpers;
  }

  function ensureModuleUrl(filePath: string, code: string): string {
    if (moduleUrls.has(filePath)) {
      return moduleUrls.get(filePath) as string;
    }

    const base64 = toBase64(code);
    const dataUrl = `data:text/javascript;base64,${base64}`;
    moduleUrls.set(filePath, dataUrl);
    return dataUrl;
  }

  const entryCode = compileModule(entry);
  return {
    code: entryCode,
    errors
  };
}

export function renderBrowserHtml(
  files: PlaygroundFiles,
  entry: string,
  options: Pick<CreatePlaygroundSessionOptions, 'framework' | 'resolveImport' | 'bootstrapScript'> = {}
): { html: string; error?: PlaygroundError } {
  const source = files[entry];

  if (!source) {
    return {
      html: '<!doctype html><html><body></body></html>',
      error: {
        message: `Entry file not found: ${entry}`,
        source: 'internal',
        code: 'unresolved',
        details: { specifier: entry, fromFile: entry, reason: 'unresolved' }
      }
    };
  }

  let html = source;
  let primaryError: PlaygroundError | undefined;

  if (!entry.endsWith('.html')) {
    const built = buildEntryModule(files, entry, {
      framework: options.framework,
      resolveImport: options.resolveImport
    });

    if (built.errors.length > 0) {
      primaryError = built.errors[0];
    }

    const bootstrapScript = options.bootstrapScript
      ? `<script>${options.bootstrapScript}</script>`
      : '';

    html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    ${bootstrapScript}
  </head>
  <body>
    <div id="app"></div>
    <script type="module">${built.code}</script>
  </body>
</html>`;
  }

  const withTs = replaceInlineTsScripts(html);
  const bridge = `${CONSOLE_BRIDGE_SCRIPT}`;

  if (withTs.includes('</head>')) {
    return {
      html: withTs.replace('</head>', `${bridge}</head>`),
      error: primaryError
    };
  }

  if (withTs.includes('</body>')) {
    return {
      html: withTs.replace('</body>', `${bridge}</body>`),
      error: primaryError
    };
  }

  return {
    html: `${withTs}${bridge}`,
    error: primaryError
  };
}

export function runInIframe(iframe: HTMLIFrameElement, html: string): void {
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.srcdoc = html;
}
