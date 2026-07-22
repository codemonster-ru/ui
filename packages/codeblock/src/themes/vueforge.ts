import type { ThemeRegistration } from '@shikijs/core';

export const VUEFORGE_SHIKI_LIGHT_THEME_NAME = 'vueforge-light';
export const VUEFORGE_SHIKI_DARK_THEME_NAME = 'vueforge-dark';

export const VUEFORGE_CODE_THEME_FALLBACKS = {
  light: {
    background: 'oklch(95.8% 0.007 260)',
    foreground: 'oklch(25.6% 0.014 260)',
    comment: 'oklch(48.8% 0.03 260)',
    string: 'oklch(45.5% 0.105 148)',
    constant: 'oklch(45% 0.115 247)',
    keyword: 'oklch(47.5% 0.15 20)',
    parameter: 'oklch(47.5% 0.095 88)',
    function: 'oklch(44.5% 0.115 307)',
    stringExpression: 'oklch(46.5% 0.091 230)',
    punctuation: 'oklch(48.8% 0.03 260)',
  },
  dark: {
    background: 'oklch(29% 0.018 260)',
    foreground: 'oklch(90% 0.012 260)',
    comment: 'oklch(74.5% 0.02 260)',
    string: 'oklch(79% 0.125 148)',
    constant: 'oklch(76% 0.11 247)',
    keyword: 'oklch(76% 0.142 20)',
    parameter: 'oklch(81.5% 0.115 88)',
    function: 'oklch(77% 0.115 307)',
    stringExpression: 'oklch(78.5% 0.105 230)',
    punctuation: 'oklch(74.5% 0.02 260)',
  },
} as const;

export const VUEFORGE_CODE_SELECTION_FALLBACKS = {
  light: {
    background: 'oklch(76% 0.11 247)',
    foreground: 'oklch(25.6% 0.014 260)',
  },
  dark: {
    background: 'oklch(45% 0.115 247)',
    foreground: 'oklch(90% 0.012 260)',
  },
} as const;

type CodeThemeMode = keyof typeof VUEFORGE_CODE_THEME_FALLBACKS;
type CssVariablesThemeFactory = typeof import('@shikijs/core').createCssVariablesTheme;

const semanticColor = (semanticName: string, legacyName: string, fallback: string) =>
  `var(--vf-${semanticName}, var(--vf-${legacyName}, ${fallback}))`;

const createThemeDefaults = (mode: CodeThemeMode) => {
  const fallback = VUEFORGE_CODE_THEME_FALLBACKS[mode];

  return {
    background: semanticColor('color-background-surface-subtle', 'color-surface-muted', fallback.background),
    foreground: semanticColor('color-text-primary', 'color-text', fallback.foreground),
    'token-comment': semanticColor('color-text-secondary', 'color-muted', fallback.comment),
    'token-string': semanticColor('color-status-success-subtle-foreground', 'color-success', fallback.string),
    'token-constant': semanticColor('color-text-link', 'color-primary', fallback.constant),
    'token-keyword': semanticColor('color-status-danger-subtle-foreground', 'color-danger', fallback.keyword),
    'token-parameter': semanticColor('color-status-warning-subtle-foreground', 'color-warn', fallback.parameter),
    'token-function': semanticColor('color-status-help-subtle-foreground', 'color-help', fallback.function),
    'token-string-expression': semanticColor(
      'color-status-info-subtle-foreground',
      'color-info',
      fallback.stringExpression,
    ),
    'token-punctuation': semanticColor('color-text-secondary', 'color-muted', fallback.punctuation),
    'token-link': semanticColor('color-text-link', 'color-primary', fallback.constant),
    'token-inserted': semanticColor('color-status-success-subtle-foreground', 'color-success', fallback.string),
    'token-deleted': semanticColor('color-status-danger-subtle-foreground', 'color-danger', fallback.keyword),
    'token-changed': semanticColor('color-status-warning-subtle-foreground', 'color-warn', fallback.parameter),
    'ansi-black': semanticColor('color-text-primary', 'color-text', fallback.foreground),
    'ansi-red': semanticColor('color-status-danger-subtle-foreground', 'color-danger', fallback.keyword),
    'ansi-green': semanticColor('color-status-success-subtle-foreground', 'color-success', fallback.string),
    'ansi-yellow': semanticColor('color-status-warning-subtle-foreground', 'color-warn', fallback.parameter),
    'ansi-blue': semanticColor('color-text-link', 'color-primary', fallback.constant),
    'ansi-magenta': semanticColor('color-status-help-subtle-foreground', 'color-help', fallback.function),
    'ansi-cyan': semanticColor('color-status-info-subtle-foreground', 'color-info', fallback.stringExpression),
    'ansi-white': semanticColor('color-text-primary', 'color-text', fallback.foreground),
    'ansi-bright-black': semanticColor('color-text-secondary', 'color-muted', fallback.comment),
    'ansi-bright-red': semanticColor('color-status-danger-subtle-foreground', 'color-danger', fallback.keyword),
    'ansi-bright-green': semanticColor('color-status-success-subtle-foreground', 'color-success', fallback.string),
    'ansi-bright-yellow': semanticColor('color-status-warning-subtle-foreground', 'color-warn', fallback.parameter),
    'ansi-bright-blue': semanticColor('color-text-link', 'color-primary', fallback.constant),
    'ansi-bright-magenta': semanticColor('color-status-help-subtle-foreground', 'color-help', fallback.function),
    'ansi-bright-cyan': semanticColor('color-status-info-subtle-foreground', 'color-info', fallback.stringExpression),
    'ansi-bright-white': semanticColor('color-text-primary', 'color-text', fallback.foreground),
  };
};

export const createVueForgeShikiTheme = (
  mode: CodeThemeMode,
  createCssVariablesTheme: CssVariablesThemeFactory,
): ThemeRegistration => {
  const theme = createCssVariablesTheme({
    name: mode === 'dark' ? VUEFORGE_SHIKI_DARK_THEME_NAME : VUEFORGE_SHIKI_LIGHT_THEME_NAME,
    variablePrefix: '--vf-codeblock-syntax-',
    variableDefaults: createThemeDefaults(mode),
  });

  theme.type = mode;
  return theme;
};
