---
title: "API"
description: "Public API reference for the layouts package"
slug: "/vueforge/layouts/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-layouts`.

## Plugin

- `default` / `VueForgeLayouts` / `createVueForgeLayouts`: installs layouts package.

```ts
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/styles.css';

app.use(VueForgeLayouts);
```

## Primitives

- `VfContainer`, `VfStack`, `VfInline`, `VfSection`, `VfGrid`.

## Shell Components

- `VfAppShell`, `VfDocumentLayout`, `VfErrorLayout`.
- Areas: `VfHeaderArea`, `VfSidebarArea`, `VfContentArea`, `VfAsideArea`, `VfFooterArea`.

## Layout Theme API

- Functions: `applyLayoutsThemeConfig`, `createLayoutsPreset`, `defaultLayoutsPreset`, `layoutsPresetToCssText`, `layoutsTokensToCssVars`, `resolveLayoutsPreset`, `resolveLayoutsThemeConfig`, `resolveLayoutsThemeOptions`.
- Types: `VfLayoutPreset`, `VfLayoutThemeConfig`, `VfLayoutThemeOptions`, `VfLayoutTokens`, `VfVueForgeLayoutsOptions`, `VfVueForgeLayoutsThemeOptions`, `VfResolvedLayoutPreset`, `VfResolvedLayoutThemeConfig`, `VfResolvedLayoutThemeOptions`.

## Composables

- `useCssVarBreakpoints`.

## Re-exported Foundation Helpers

- `vfBreakpoints`, `toMinWidthQuery`, `toMaxWidthQuery`, `useBreakpoint`, `useBreakpoints`, `useBreakpointValue`.

## Usage Example

```ts
import { VfAppShell, VfHeaderArea, VfContentArea } from '@codemonster-ru/vueforge-layouts';
```

## CSS Exports

- `@codemonster-ru/vueforge-layouts/styles.css`
- `@codemonster-ru/vueforge-layouts/tokens.css`
- `@codemonster-ru/vueforge-layouts/theme.css`
