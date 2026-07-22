# VueForge Theme

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-theme)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-theme)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-theme)

A framework-agnostic token and preset engine for the VueForge ecosystem.

## Requirements

- Node.js 18 or newer.
- No Vue peer dependency. Vue packages consume this engine internally.

## Install

```bash
npm install @codemonster-ru/vueforge-theme
```

```bash
pnpm add @codemonster-ru/vueforge-theme
```

```bash
yarn add @codemonster-ru/vueforge-theme
```

## Public API

The package has one ESM entry and no CSS side effects:

```ts
import {
  resolveThemeConfig,
  themePresetToCssText,
  themeTokensToCssVars,
  vfBreakpoints,
} from '@codemonster-ru/vueforge-theme';

const variables = themeTokensToCssVars({
  colorBg: '#fff',
  breakpoint2xl: '96rem',
});
```

The engine intentionally does not ship an application default preset. Use the preset from
VueForge Core or provide a complete `VfThemePreset` before calling `resolveThemeConfig`.

`themePresetToCssText` is safe to use during SSR. `applyThemeConfig` writes to a `Document`, so
call it only in a browser or pass an explicit DOM document.

## Package-local documentation

The public contract is available directly in
[src/index.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/theme/src/index.ts),
[src/types.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/theme/src/types.ts), and
[CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/theme/CHANGELOG.md).
Ecosystem upgrade requirements are documented in the repository
[migration guide](https://github.com/codemonster-ru/vueforge/blob/main/docs/migration-guide.md).
