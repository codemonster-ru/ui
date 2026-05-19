---
title: "Guides"
description: "Limitations and related packages for the icons package"
slug: "/vueforge/icons/guides"
order: 6
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

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

- Peer dependency: `vue ^3.5.0`.
- Icon generation scripts are internal build tooling, not runtime API.

## Related Packages

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-codeblock` (uses icons package)
