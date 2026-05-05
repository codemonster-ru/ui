import type { App, Plugin } from 'vue';
import VfCodeBlock from './components/VfCodeBlock.vue';
import type { CodeBlockPluginOptions, CodeBlockThemeVarOptions } from './types';

export { default as VfCodeBlock } from './components/VfCodeBlock.vue';
export { escapeCodeHtml, highlightCodeBlock, highlightCodeLine } from './services/code-highlight';
export {
  SUPPORTED_CODE_BLOCK_LANGUAGES,
  type CodeBlockCopyPayload,
  type CodeBlockCssVarMap,
  type CodeBlockCssVarValue,
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
  const lightSelectors = [`${scopeSelector}[data-theme="light"]`, `${scopeSelector}[data-vf-theme="light"]`].join(', ');
  const darkSelectors = [`${scopeSelector}[data-theme="dark"]`, `${scopeSelector}[data-vf-theme="dark"]`].join(', ');

  if (base) {
    chunks.push(`${scopeSelector} {\n${base}\n}`);
  }
  if (light) {
    chunks.push(`${lightSelectors} {\n${light}\n}`);
  }
  if (dark) {
    chunks.push(`${darkSelectors} {\n${dark}\n}`);
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
    applyRuntimeThemeVars(options);
  },
};

export default plugin;
