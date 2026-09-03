import globals from 'globals';
import { createTsConfig } from '../../eslint.base.mjs';

export default [
  ...createTsConfig({
    // The generated set is data written by scripts/generate-icons.mjs, not source anyone edits.
    ignores: ['dist/**', 'node_modules/**', 'src/generated/**'],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    // The shared config declares Node globals for `.ts` and `.js`; the generator is `.mjs` and runs
    // in Node like any other build script, so it needs them too.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
];
