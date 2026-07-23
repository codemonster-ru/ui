---
title: 'Guides'
description: 'Limitations and related packages for the icons package'
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

### Provide Accessible Semantics

`VueIconify` forwards non-prop attributes to the rendered SVG. Hide decorative icons from assistive
technology with `aria-hidden="true"`. When an icon is the only source of meaning, use `role="img"`
and a concise `aria-label`; when it appears inside a named button or link, let the control provide
the accessible name and keep the icon decorative.

The `spin` animation stops under `prefers-reduced-motion: reduce`. Do not use motion as the only way
to communicate state.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Unknown names render the `moon` fallback; validate user-provided names against `iconNames` when a
  silent fallback would be ambiguous.
- Icon generation scripts are internal build tooling, not runtime API.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-codeblock/view` (uses icons package)
