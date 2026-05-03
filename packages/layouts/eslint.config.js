import globals from 'globals';
import { createVueTsConfig } from '../../eslint.base.mjs';

export default [
  ...createVueTsConfig({
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    tsconfigRootDir: import.meta.dirname,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/one-component-per-file': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  }),
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
];
