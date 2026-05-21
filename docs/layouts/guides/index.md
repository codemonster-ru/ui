---
title: "Guides"
description: "Limitations and related packages for the layouts package"
order: 6
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

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

- Peer dependencies: `vue ^3.4.0`, `@codemonster-ru/vueforge-core ^1.18.0`.

## Related Packages

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-theme`
