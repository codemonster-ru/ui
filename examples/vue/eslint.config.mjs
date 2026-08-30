import { createVueTsConfig } from '../../eslint.base.mjs';

// The showcase is not published, and most of its no-unsafe-* reports are the project service
// failing to resolve `.vue` types that vue-tsc resolves — the same blind spot the base config
// already tolerates in tests. A handful are genuine `any` from untyped showcase data and are worth
// fixing; keeping the family at warn here reports all of them without failing the build over the
// resolver. Every published package runs these at error.
const showcaseTypeGaps = {
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
};

export default createVueTsConfig({
  ignores: ['dist/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
  rules: {
    'vue/multi-word-component-names': 'off',
    ...showcaseTypeGaps,
  },
});
