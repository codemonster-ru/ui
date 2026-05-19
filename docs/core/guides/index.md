---
title: "Guides"
description: "Limitations and related packages for the core package"
slug: "/vueforge/core/guides"
order: 6
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

### Bootstrap Theme at App Root

Use one app-level bootstrap path for theme provider + core plugin to keep behavior deterministic.

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

createApp(App).use(VueForgeCore);
```

### Choose CSS Entry by Scope

- `styles.css`: full default bundle for most apps.
- `foundation.css`: foundation-only layer for incremental adoption.
- `tokens.css` + `theme.css`: when you need token/theme control separately.

### Adopt Incrementally

Start with foundation/composables (`useBreakpointValue`, `useScrollLock`), then migrate component by component.

## Limitations

- Peer dependency: `vue ^3.5.0`.
- Theme/foundation CSS usage should be documented per entry export.

## Related Packages

- `@codemonster-ru/vueforge-theme`: shared theme engine.
- `@codemonster-ru/vueforge-layouts`: layout primitives built for the same ecosystem.
