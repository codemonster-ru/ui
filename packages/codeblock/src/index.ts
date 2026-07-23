import type { App, Plugin } from 'vue';
import { CODE_BLOCK_LANGUAGE_OPTIONS_KEY } from './config';
import VfCodeBlock from './components/VfCodeBlock.vue';
import type { CodeBlockPluginOptions, CodeBlockThemeVarOptions } from './types';

export { default as VfCodeBlock } from './components/VfCodeBlock.vue';
export {
  SUPPORTED_CODE_BLOCK_LANGUAGES,
  type CodeBlockCopyPayload,
  type CodeBlockCssVarMap,
  type CodeBlockCssVarValue,
  type CodeBlockFallbackLanguage,
  type CodeBlockHighlightOptions,
  type CodeBlockLanguage,
  type CodeBlockPluginOptions,
  type CodeBlockProps,
  type CodeBlockThemeVarOptions,
  type CodeBlockTheme,
  type SupportedCodeBlockLanguage,
} from './types';

const STYLE_ELEMENT_ID = 'vf-codeblock-runtime-theme-vars';

const normalizeVarName = (name: string) => (name.startsWith('--') ? name : `--${name}`);

const mapToCssVars = (variables: CodeBlockThemeVarOptions['base'] = {}) =>
  Object.entries(variables)
    .map(([name, value]) => `${normalizeVarName(name)}: ${String(value)};`)
    .join('\n');

const resolveScope = (scope?: string) => {
  if (!scope || !scope.trim()) {
    return ':root';
  }

  return scope.trim();
};

const createThemeCss = (themeVars: CodeBlockThemeVarOptions, scope?: string) => {
  const scopeSelector = resolveScope(scope);
  const base = mapToCssVars(themeVars.base);
  const light = mapToCssVars(themeVars.light);
  const dark = mapToCssVars(themeVars.dark);
  const chunks: string[] = [];
  const modeSelectors = (mode: 'light' | 'dark') => {
    const boundarySelector = `:where([data-vf-theme="${mode}"])`;

    return [
      `:is(${scopeSelector}):where([data-vf-theme="${mode}"])`,
      `${boundarySelector} :is(${scopeSelector})`,
      `:where(${scopeSelector}) ${boundarySelector}`,
    ].join(', ');
  };
  const lightSelectors = modeSelectors('light');
  const darkSelectors = modeSelectors('dark');
  const lightDeclarations = [base, light].filter(Boolean).join('\n');
  const darkDeclarations = [base, dark].filter(Boolean).join('\n');

  if (base) {
    chunks.push(`${scopeSelector} {\n${base}\n}`);
  }
  if (lightDeclarations) {
    chunks.push(`${lightSelectors} {\n${lightDeclarations}\n}`);
  }
  if (darkDeclarations) {
    chunks.push(`${darkSelectors} {\n${darkDeclarations}\n}`);
  }

  return chunks.join('\n');
};

const ensureStyleElement = (nonce?: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  let styleElement = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = STYLE_ELEMENT_ID;
    if (nonce) {
      styleElement.setAttribute('nonce', nonce);
    }
    document.head.appendChild(styleElement);
    return styleElement;
  }

  if (nonce && !styleElement.getAttribute('nonce')) {
    styleElement.setAttribute('nonce', nonce);
  }

  return styleElement;
};

export const setCodeBlockThemeVars = (
  themeVars: CodeBlockThemeVarOptions,
  options?: Pick<CodeBlockPluginOptions, 'themeScope' | 'styleNonce'>,
) => {
  if (typeof document === 'undefined') {
    return;
  }

  const cssText = createThemeCss(themeVars, options?.themeScope);
  if (!cssText) {
    return;
  }

  const styleElement = ensureStyleElement(options?.styleNonce);
  if (!styleElement) {
    return;
  }

  styleElement.textContent = cssText;
};

const applyRuntimeThemeVars = (options?: CodeBlockPluginOptions) => {
  if (typeof document === 'undefined') {
    return;
  }

  const themeVars = options?.themeVars;
  if (!themeVars) {
    return;
  }

  setCodeBlockThemeVars(themeVars, options);
};

const plugin: Plugin = {
  install(app: App, options?: CodeBlockPluginOptions) {
    app.component('VfCodeBlock', VfCodeBlock);
    app.provide(CODE_BLOCK_LANGUAGE_OPTIONS_KEY, {
      allowedLanguages: options?.allowedLanguages,
    });
    applyRuntimeThemeVars(options);

    if (options?.preloadLanguages?.length) {
      void import('./highlight').then(({ preloadCodeBlockLanguages }) =>
        preloadCodeBlockLanguages(options.preloadLanguages!, options.allowedLanguages),
      );
    }
  },
};

export default plugin;
