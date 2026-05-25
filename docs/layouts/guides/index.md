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
import { VfAppShell, VfHeaderArea, VfContentArea } from '@codemonster-ru/vueforge-layouts';
import { VfCard, VfButton } from '@codemonster-ru/vueforge-core';
```

### Keep Breakpoints Consistent

Prefer re-exported foundation helpers from layouts when building responsive layout logic in the same package context.

### Theme Layout Tokens via Theme API

Use `createLayoutsPreset`/`applyLayoutsThemeConfig` for layout token changes instead of ad-hoc CSS overrides.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.4.0`.
- Peer dependency: `@codemonster-ru/vueforge-core ^1.18.0`.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-theme`
