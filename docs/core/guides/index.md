---
title: "Guides"
description: "Limitations and related packages for the core package"
order: 6
---

# Guides

This section provides a quick overview before the detailed subsections below.


## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

These practices help keep setup predictable across application and package boundaries.

### Bootstrap Theme at App Root

Use one app-level bootstrap path for theme provider + core plugin to keep behavior deterministic.

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

createApp(App).use(VueForgeCore);
```

### Choose CSS Entry by Scope

The following items are listed in this section:

- `styles.css`: full default bundle for most apps.
- `foundation.css`: foundation-only layer for incremental adoption.
- `tokens.css` + `theme.css`: when you need token/theme control separately.

### Adopt Incrementally

Start with foundation/composables (`useBreakpointValue`, `useScrollLock`), then migrate component by component.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Theme/foundation CSS usage should be documented per entry export.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-theme`: shared theme engine.
- `@codemonster-ru/vueforge-layouts`: layout primitives built for the same ecosystem.
