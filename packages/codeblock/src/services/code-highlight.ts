import { createBundledHighlighter } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const shikiLanguages = {
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
  langs: shikiLanguages,
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

type ShikiLanguage = keyof typeof shikiLanguages;

const loadedLanguages = new Set<ShikiLanguage>();
const loadingLanguages = new Map<ShikiLanguage, Promise<void>>();

const normalizeLanguage = (language: string): ShikiLanguage | null => {
  const normalized = language.toLowerCase();

  if (normalized === 'plaintext' || normalized === 'text' || normalized === 'txt') {
    return null;
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

  if (normalized in shikiLanguages) {
    return normalized as ShikiLanguage;
  }

  return null;
};

export const renderPlainCodeLines = (code: string): string[] =>
  (code || '').replace(/\r\n/g, '\n').split('\n').map(escapeCodeHtml);

const ensureLanguageLoaded = async (language: ShikiLanguage) => {
  if (loadedLanguages.has(language)) {
    return;
  }

  const existingRequest = loadingLanguages.get(language);
  if (existingRequest) {
    await existingRequest;
    return;
  }

  const highlighter = await getHighlighter;
  const request = highlighter.loadLanguage(language).then(() => {
    loadedLanguages.add(language);
    loadingLanguages.delete(language);
  });

  loadingLanguages.set(language, request);
  await request;
};

export const highlightCodeLines = async (
  language: string,
  code: string,
  theme: 'light' | 'dark',
  highlight = true,
): Promise<string[]> => {
  const normalizedCode = (code || '').replace(/\r\n/g, '\n');

  if (!highlight) {
    return renderPlainCodeLines(normalizedCode);
  }

  const normalizedLanguage = normalizeLanguage(language);

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
): Promise<string> => (await highlightCodeLines(language, code, theme, highlight)).join('\n');

export const highlightCodeLine = async (
  language: string,
  line: string,
  theme: 'light' | 'dark' = 'light',
  highlight = true,
): Promise<string> => (await highlightCodeLines(language, line, theme, highlight))[0] ?? '';
