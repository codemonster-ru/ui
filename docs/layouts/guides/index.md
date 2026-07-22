---
title: "Guides"
description: "Limitations and related packages for the layouts package"
order: 6
---

# Guides

This section provides a quick overview before the detailed subsections below.


## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

Follow these patterns to keep layout composition consistent across pages and shells.

### Pair with Core for Full App Shell UX

Use layouts for structure and `@codemonster-ru/vueforge-core` for interactive primitives inside shell areas.

```ts
import VfAppShell from '@codemonster-ru/vueforge-layouts/app-shell';
import VfHeaderArea from '@codemonster-ru/vueforge-layouts/header-area';
import { VfButton } from '@codemonster-ru/vueforge-core/button';
```

Use root imports plus Core/Layout full stylesheets for an application-wide setup. For a granular
setup, import the shared Core and Layouts token/theme/base entries once, then use component subpaths
for browser auto CSS. Those subpaths do not include the shared foundation. Node ESM subpaths are
CSS-free for SSR; fully manual browser delivery uses named root imports plus explicit component CSS.

### Keep Breakpoints Consistent

Prefer re-exported foundation helpers from layouts when building responsive layout logic in the same package context.

### Theme Layout Tokens via Theme API

Use `createLayoutsPreset`/`applyLayoutsThemeConfig` for layout token changes instead of ad-hoc CSS overrides.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Peer dependency: `@codemonster-ru/vueforge-core ^1.36.0`.
- Consumer tooling and SSR require Node.js 18 or newer.
- The plugin configures themes but does not globally register layout components.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-theme`
