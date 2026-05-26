import { createBundledHighlighter } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { SUPPORTED_CODE_BLOCK_LANGUAGES } from '../types';

const languageLoaders = {
  bash: () => import('@shikijs/langs/bash'),
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  sass: () => import('@shikijs/langs/sass'),
  scss: () => import('@shikijs/langs/scss'),
  typescript: () => import('@shikijs/langs/typescript'),
  vue: () => import('@shikijs/langs/vue'),
};

const shikiThemes = {
  'github-dark': () => import('@shikijs/themes/github-dark'),
  'github-light': () => import('@shikijs/themes/github-light'),
};

const createHighlighter = createBundledHighlighter({
  langs: languageLoaders,
  themes: shikiThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const getHighlighter = createHighlighter({
  langs: [],
  themes: Object.keys(shikiThemes) as Array<keyof typeof shikiThemes>,
});

export const SHIKI_LIGHT_THEME = 'github-light';
export const SHIKI_DARK_THEME = 'github-dark';

export const escapeCodeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const escapeAttribute = (value: string): string => escapeCodeHtml(value).replaceAll('"', '&quot;');

type FallbackLanguage = 'plaintext' | 'text';
interface HighlightRuntimeOptions {
  allowedLanguages?: string[];
  fallbackLanguage?: FallbackLanguage;
}

type ShikiLanguageLoader = keyof typeof languageLoaders;

const loadedLanguages = new Set<ShikiLanguageLoader>();
const loadingLanguages = new Map<ShikiLanguageLoader, Promise<void>>();
const warnedDisallowedLanguages = new Set<string>();
const languageLoadAttempts = new Map<ShikiLanguageLoader, number>();

const normalizeAllowlistLanguage = (language: string): string => {
  const normalized = language.toLowerCase().trim();

  if (normalized === 'plaintext' || normalized === 'text' || normalized === 'txt') {
    return 'plaintext';
  }

  if (normalized === 'shell' || normalized === 'sh') {
    return 'bash';
  }

  if (normalized === 'js') {
    return 'javascript';
  }

  if (normalized === 'ts') {
    return 'typescript';
  }

  if (normalized in languageLoaders) {
    return normalized;
  }

  return normalized;
};

const toShikiLanguage = (language: string): ShikiLanguageLoader | null => {
  const normalized = normalizeAllowlistLanguage(language);

  if (normalized === 'plaintext' || normalized === 'text') {
    return null;
  }

  if (normalized in languageLoaders) {
    return normalized as ShikiLanguageLoader;
  }

  return null;
};

export const renderPlainCodeLines = (code: string): string[] =>
  (code || '').replace(/\r\n/g, '\n').split('\n').map(escapeCodeHtml);

const ensureLanguageLoaded = async (language: ShikiLanguageLoader) => {
  if (loadedLanguages.has(language)) {
    return;
  }

  const existingRequest = loadingLanguages.get(language);
  if (existingRequest) {
    await existingRequest;
    return;
  }

  const highlighter = await getHighlighter;
  languageLoadAttempts.set(language, (languageLoadAttempts.get(language) ?? 0) + 1);
  const request = highlighter.loadLanguage(language).then(() => {
    loadedLanguages.add(language);
    loadingLanguages.delete(language);
  });

  loadingLanguages.set(language, request);
  await request;
};

const resolveAllowlist = (allowedLanguages?: string[]) =>
  new Set((allowedLanguages ?? [...SUPPORTED_CODE_BLOCK_LANGUAGES]).map(normalizeAllowlistLanguage));

const warnDisallowedLanguage = (language: string, fallbackLanguage: FallbackLanguage) => {
  if (!import.meta.env?.DEV || warnedDisallowedLanguages.has(language)) {
    return;
  }

  warnedDisallowedLanguages.add(language);
  console.warn(
    `[vf-codeblock] Language "${language}" is not in allowedLanguages. Falling back to "${fallbackLanguage}".`,
  );
};

const resolveLanguageWithAllowlist = (
  language: string,
  options?: HighlightRuntimeOptions,
): string => {
  const allowlist = resolveAllowlist(options?.allowedLanguages);
  const requestedLanguage = normalizeAllowlistLanguage(language);
  const fallbackLanguage = options?.fallbackLanguage ?? 'plaintext';

  if (allowlist.has(requestedLanguage)) {
    return requestedLanguage;
  }

  warnDisallowedLanguage(requestedLanguage, fallbackLanguage);
  return fallbackLanguage;
};

export const highlightCodeLines = async (
  language: string,
  code: string,
  theme: 'light' | 'dark',
  highlight = true,
  options?: HighlightRuntimeOptions,
): Promise<string[]> => {
  const normalizedCode = (code || '').replace(/\r\n/g, '\n');

  if (!highlight) {
    return renderPlainCodeLines(normalizedCode);
  }

  const resolvedLanguage = resolveLanguageWithAllowlist(language, options);
  const normalizedLanguage = toShikiLanguage(resolvedLanguage);

  if (!normalizedLanguage) {
    return renderPlainCodeLines(normalizedCode);
  }

  try {
    await ensureLanguageLoaded(normalizedLanguage);
    const highlighter = await getHighlighter;
    const result = highlighter.codeToTokens(normalizedCode, {
      lang: normalizedLanguage,
      theme: theme === 'dark' ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME,
    });

    return result.tokens.map((lineTokens) =>
      lineTokens
        .map((token) => {
          const styles = [`color: ${token.color}`];

          if (token.fontStyle) {
            if (token.fontStyle & 1) {
              styles.push('font-style: italic');
            }
            if (token.fontStyle & 2) {
              styles.push('font-weight: 700');
            }
            if (token.fontStyle & 4) {
              styles.push('text-decoration: underline');
            }
          }

          return `<span class="vf-codeblock__shiki-token vf-codeblock__shiki-token" style="${escapeAttribute(styles.join('; '))}">${escapeCodeHtml(token.content)}</span>`;
        })
        .join(''),
    );
  } catch {
    return renderPlainCodeLines(normalizedCode);
  }
};

export const highlightCodeBlock = async (
  language: string,
  code: string,
  theme: 'light' | 'dark' = 'light',
  highlight = true,
  options?: HighlightRuntimeOptions,
): Promise<string> => (await highlightCodeLines(language, code, theme, highlight, options)).join('\n');

export const highlightCodeLine = async (
  language: string,
  line: string,
  theme: 'light' | 'dark' = 'light',
  highlight = true,
  options?: HighlightRuntimeOptions,
): Promise<string> => (await highlightCodeLines(language, line, theme, highlight, options))[0] ?? '';

export const preloadCodeBlockLanguages = async (languages: string[], allowedLanguages?: string[]) => {
  if (!languages.length) {
    return;
  }

  const allowlist = resolveAllowlist(allowedLanguages);

  await Promise.all(
    languages.map(async (language) => {
      const normalized = normalizeAllowlistLanguage(language);
      if (!allowlist.has(normalized)) {
        return;
      }

      const shikiLanguage = toShikiLanguage(normalized);
      if (!shikiLanguage) {
        return;
      }

      try {
        await ensureLanguageLoaded(shikiLanguage);
      } catch {
        // Ignore preload errors to keep runtime behavior resilient.
      }
    }),
  );
};

export const __resetCodeBlockHighlightRuntimeForTests = () => {
  loadedLanguages.clear();
  loadingLanguages.clear();
  warnedDisallowedLanguages.clear();
  languageLoadAttempts.clear();
};

export const __getCodeBlockLanguageLoadAttemptsForTests = (language: string) => {
  const normalized = toShikiLanguage(language);
  return normalized ? (languageLoadAttempts.get(normalized) ?? 0) : 0;
};
