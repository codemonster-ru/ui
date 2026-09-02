import { createVueTsConfig } from '../../eslint.base.mjs';
import globals from 'globals';

export default [
  ...createVueTsConfig({
    ignores: ['dist/**', 'node_modules/**', 'showcase-dist/**'],
    tsconfigRootDir: import.meta.dirname,
    rules: {
      semi: ['error', 'always'],
      'vue/multi-word-component-names': 'off',
    },
  }),
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
