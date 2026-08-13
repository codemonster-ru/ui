import { createTsConfig } from '../../eslint.base.mjs';

export default createTsConfig({
  ignores: ['dist/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
});
