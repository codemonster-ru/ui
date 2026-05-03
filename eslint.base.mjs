import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export function createVueTsConfig({
  ignores = ['dist/**', 'coverage/**'],
  rules = {},
  tsconfigRootDir,
} = {}) {
  return tseslint.config(
    { ignores },
    {
      files: ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs,vue}'],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    {
      files: ['**/*.{ts,vue,js}'],
      languageOptions: {
        parser: vueParser,
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parserOptions: {
          parser: tseslint.parser,
          ecmaVersion: 'latest',
          sourceType: 'module',
          extraFileExtensions: ['.vue'],
          tsconfigRootDir,
        },
      },
      rules,
    },
  );
}

export function createTsConfig({
  ignores = ['dist/**', 'coverage/**'],
  rules = {},
  tsconfigRootDir,
} = {}) {
  return tseslint.config(
    { ignores },
    {
      files: ['**/*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}'],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
      files: ['**/*.{ts,js}'],
      languageOptions: {
        parser: tseslint.parser,
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          tsconfigRootDir,
        },
      },
      rules,
    },
  );
}
