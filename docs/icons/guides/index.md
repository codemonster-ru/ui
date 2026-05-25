---
title: "Guides"
description: "Limitations and related packages for the icons package"
order: 6
---

# Guides

This section provides a quick overview before the detailed subsections below.


## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

Apply these patterns to keep icon usage consistent and tooling-friendly.

### Use `iconNames` for Validation and Tooling

For docs/search UIs, validate user input against `iconNames` before rendering.

```ts
import { iconNames } from '@codemonster-ru/vueforge-icons';

const isValidIcon = (name: string) => iconNames.includes(name as never);
```

### Build Icon Pickers from Metadata

Use `iconCatalog` and `iconGroups` to generate categorized icon galleries instead of hardcoded lists.

### Keep Icon Sizing Token-Driven

Prefer token/CSS-variable sizing over hardcoded px values to stay consistent with `core` and `layouts` themes.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Icon generation scripts are internal build tooling, not runtime API.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-codeblock` (uses icons package)
