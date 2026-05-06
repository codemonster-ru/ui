import { createVueTsConfig } from '../../eslint.base.mjs';
import globals from 'globals';

const baseConfig = createVueTsConfig({
  ignores: ['dist/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
  rules: {
    'vue/multi-word-component-names': 'off',
  },
});

export default [
  ...baseConfig,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
