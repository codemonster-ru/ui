import { createVueTsConfig } from '../../eslint.base.mjs';

export default createVueTsConfig({
  ignores: ['dist/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
  rules: {
    'vue/multi-word-component-names': 'off',
    // The one report here is `createApp(App)`, where the project service cannot resolve the `.vue`
    // type that vue-tsc resolves — the same blind spot the VueForge example documents. Kept at warn
    // rather than off so a genuine `any` in showcase data still surfaces; `typecheck` is what
    // actually guards this app.
    '@typescript-eslint/no-unsafe-argument': 'warn',
  },
});
