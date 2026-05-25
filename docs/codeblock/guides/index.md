---
title: "Guides"
description: "Limitations and related packages for the codeblock package"
order: 6
---

# Guides

Integration notes for using `@codemonster-ru/vueforge-codeblock` in real projects and docs environments.

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

Use these patterns as a baseline for stable integration in apps and docs portals.

### Use with VueForge Core Theme Provider

`VfCodeBlock` inherits theme state cleanly when rendered under `VfThemeProvider` from `@codemonster-ru/vueforge-core`.

```ts
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';
```

### Scope Runtime Theme Vars to Docs Area

For docs portals, avoid polluting global `:root` and scope variables to a container.

```ts
import { setCodeBlockThemeVars } from '@codemonster-ru/vueforge-codeblock';

setCodeBlockThemeVars(
  {
    base: { '--vf-code-bg': 'var(--vf-color-bg)' },
    light: { '--vf-code-border': 'var(--vf-color-border)' },
    dark: { '--vf-code-border': 'var(--vf-color-border)' }
  },
  { themeScope: '#docs-content' }
);
```

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.4.0`.
- Browser-only behavior for runtime style injection (`setCodeBlockThemeVars`).

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-icons`
