import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

// The no-unsafe-* family reports wherever `any` leaks in from an untyped boundary. Those sites are
// worth fixing, but not in the change that turns type-aware linting on, so they start as warnings
// and get promoted package by package.
const typeAwareRamp = {
  rules: {
    // eslint's project service and vue-tsc disagree about assertions inside SFCs: its autofix
    // stripped non-null assertions vue-tsc still requires. Report them, but let the build's
    // checker stay the authority until the two agree.
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
  },
};

// Type-aware rules need a file the TypeScript project service owns. Plain JavaScript never is, and
// the packages deliberately keep build tooling, spec files, and test shims outside their tsconfig
// include globs. Linting those with type information off beats widening the build's scope to suit
// the linter.
const outsideTypeScriptProjects = {
  ...tseslint.configs.disableTypeChecked,
  files: [
    '**/*.{js,mjs,cjs}',
    '**/*.config.{ts,mts,cts}',
    '**/*.spec.{ts,mts,cts}',
    '**/__tests__/**',
    '**/test-shims/**',
    '**/build/**',
  ],
};

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
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    typeAwareRamp,
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
          projectService: true,
          sourceType: 'module',
          extraFileExtensions: ['.vue'],
          tsconfigRootDir,
        },
      },
      rules,
    },
    outsideTypeScriptProjects,
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
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    prettier,
    typeAwareRamp,
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
          projectService: true,
          sourceType: 'module',
          tsconfigRootDir,
        },
      },
      rules,
    },
    outsideTypeScriptProjects,
  );
}
