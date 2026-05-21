---
title: "Guides"
description: "Limitations and related packages for the theme package"
order: 5
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

### Use Theme Package as Single Source of Token Resolution

Keep token composition in `@codemonster-ru/vueforge-theme`, then consume resolved CSS in UI packages.

```ts
import { themePresetToCssText, createThemePreset } from '@codemonster-ru/vueforge-theme';
```

### Apply Theme at App Root Once

Apply theme config once during app bootstrap to avoid repeated style recalculations.

```ts
import { applyThemeConfig } from '@codemonster-ru/vueforge-theme';

applyThemeConfig({
  light: { colorPrimary: '#2563eb' }
});
```

### Keep Storage and Attribute Keys Consistent Across Packages

If you override theme attribute/storage behavior, keep it aligned with consuming packages (`core`, `layouts`) to avoid mode mismatch.

## Limitations

- No Vue plugin API by design; pure runtime/helpers.

## Related Packages

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-layouts`
