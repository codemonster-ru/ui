import './tokens.css';
import './critical.css';
import './codeblock.css';

export { default, setCodeBlockThemeVars } from './index';
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
