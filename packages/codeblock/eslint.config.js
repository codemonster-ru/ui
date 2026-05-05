import { createVueTsConfig } from '../../eslint.base.mjs';

export default createVueTsConfig({
  ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
  rules: {
    'vue/multi-word-component-names': 'off',
  },
});
