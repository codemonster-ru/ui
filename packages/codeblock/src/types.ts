export const SUPPORTED_CODE_BLOCK_LANGUAGES = [
  'plaintext',
  'text',
  'txt',
  'js',
  'javascript',
  'ts',
  'typescript',
  'vue',
  'html',
  'json',
  'bash',
  'shell',
  'sh',
  'css',
  'scss',
  'sass',
] as const;

export type CodeBlockTheme = 'inherit' | 'light' | 'dark';

export type SupportedCodeBlockLanguage = (typeof SUPPORTED_CODE_BLOCK_LANGUAGES)[number];

export type CodeBlockLanguage = SupportedCodeBlockLanguage | (string & {});

export interface CodeBlockCopyPayload {
  text: string;
}

export type CodeBlockCssVarValue = string | number;
export type CodeBlockCssVarMap = Record<string, CodeBlockCssVarValue>;

export interface CodeBlockThemeVarOptions {
  base?: CodeBlockCssVarMap;
  light?: CodeBlockCssVarMap;
  dark?: CodeBlockCssVarMap;
}

export interface CodeBlockPluginOptions {
  themeVars?: CodeBlockThemeVarOptions;
  themeScope?: string;
  styleNonce?: string;
}

export interface CodeBlockProps {
  code?: string;
  language?: CodeBlockLanguage;
  filename?: string;
  showHeader?: boolean;
  showLineNumbers?: boolean;
  copyable?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  copiedDuration?: number;
  languageLabel?: string;
  disabled?: boolean;
  wrap?: boolean;
  highlight?: boolean;
  maxHeight?: string;
  ariaLabel?: string;
  theme?: CodeBlockTheme;
}
