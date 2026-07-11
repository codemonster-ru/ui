---
title: "API"
description: "Public API reference for the layouts package"
order: 3
---

# API

This section provides a quick overview before the detailed subsections below.


## Overview

Public API surface of `@codemonster-ru/vueforge-layouts`.

JS subpath exports (component entry + auto CSS):

- `@codemonster-ru/vueforge-layouts/container`
- `@codemonster-ru/vueforge-layouts/stack`
- `@codemonster-ru/vueforge-layouts/inline`
- `@codemonster-ru/vueforge-layouts/section`
- `@codemonster-ru/vueforge-layouts/grid`
- `@codemonster-ru/vueforge-layouts/app-shell`
- `@codemonster-ru/vueforge-layouts/admin-layout`
- `@codemonster-ru/vueforge-layouts/document-layout`
- `@codemonster-ru/vueforge-layouts/auth-layout`
- `@codemonster-ru/vueforge-layouts/error-layout`
- `@codemonster-ru/vueforge-layouts/setup-layout`
- `@codemonster-ru/vueforge-layouts/header-area`
- `@codemonster-ru/vueforge-layouts/sidebar-area`
- `@codemonster-ru/vueforge-layouts/content-area`
- `@codemonster-ru/vueforge-layouts/aside-area`
- `@codemonster-ru/vueforge-layouts/footer-area`

## Plugin

The following items are listed in this section:

- `default` / `VueForgeLayouts` / `createVueForgeLayouts`: installs layouts package.

```ts
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/base.css';
import '@codemonster-ru/vueforge-layouts/tokens.css';
import '@codemonster-ru/vueforge-layouts/theme.css';
import '@codemonster-ru/vueforge-layouts/app-shell.css';

app.use(VueForgeLayouts);
```

## Primitives

The following items are listed in this section:

- `VfContainer`
- `VfStack`
- `VfInline`
- `VfSection`
- `VfGrid`

## Shell Components

The following items are listed in this section:

- `VfAppShell`
- `VfAdminLayout`
- `VfDocumentLayout`
- `VfAuthLayout`
- `VfErrorLayout`
- `VfSetupLayout`
- Area: `VfHeaderArea`.
- Area: `VfSidebarArea`.
- Area: `VfContentArea`.
- Area: `VfAsideArea`.
- Area: `VfFooterArea`.

## Layout Theme API

The following items are listed in this section:

- Function: `applyLayoutsThemeConfig`.
- Function: `createLayoutsPreset`.
- Function: `defaultLayoutsPreset`.
- Function: `layoutsPresetToCssText`.
- Function: `layoutsTokensToCssVars`.
- Function: `resolveLayoutsPreset`.
- Function: `resolveLayoutsThemeConfig`.
- Function: `resolveLayoutsThemeOptions`.
- Type: `VfLayoutPreset`.
- Type: `VfLayoutThemeConfig`.
- Type: `VfLayoutThemeOptions`.
- Type: `VfLayoutTokens`.
- Type: `VfVueForgeLayoutsOptions`.
- Type: `VfVueForgeLayoutsThemeOptions`.
- Type: `VfResolvedLayoutPreset`.
- Type: `VfResolvedLayoutThemeConfig`.
- Type: `VfResolvedLayoutThemeOptions`.

## Composables

The following items are listed in this section:

- `useCssVarBreakpoints`.

## Re-exported Foundation Helpers

The following items are listed in this section:

- `vfBreakpoints`
- `toMinWidthQuery`
- `toMaxWidthQuery`
- `useBreakpoint`
- `useBreakpoints`
- `useBreakpointValue`

## Usage Example

The code snippet below illustrates this section.

```ts
import { VfAppShell, VfHeaderArea, VfContentArea } from '@codemonster-ru/vueforge-layouts';
```

```ts
import VfAppShell from '@codemonster-ru/vueforge-layouts/app-shell';
import VfHeaderArea from '@codemonster-ru/vueforge-layouts/header-area';
import VfContentArea from '@codemonster-ru/vueforge-layouts/content-area';
```

## CSS Exports

The following items are listed in this section:

- `@codemonster-ru/vueforge-layouts/base.css`
- `@codemonster-ru/vueforge-layouts/tokens.css`
- `@codemonster-ru/vueforge-layouts/theme.css`

Per-layout entries:

- `container.css`
- `stack.css`
- `inline.css`
- `section.css`
- `grid.css`
- `app-shell.css`
- `admin-layout.css`
- `document-layout.css`
- `auth-layout.css`
- `error-layout.css`
- `setup-layout.css`
- `header-area.css`
- `sidebar-area.css`
- `content-area.css`
- `aside-area.css`
- `footer-area.css`

Notes:

- JS component subpaths auto-import their matching CSS entry.
- Root import `@codemonster-ru/vueforge-layouts` keeps manual CSS control.
