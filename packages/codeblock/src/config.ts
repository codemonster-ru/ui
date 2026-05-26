import type { InjectionKey } from 'vue';
import type { CodeBlockLanguageRuntimeOptions } from './types';

export const CODE_BLOCK_LANGUAGE_OPTIONS_KEY: InjectionKey<CodeBlockLanguageRuntimeOptions> =
  Symbol('vf-codeblock-language-options');
