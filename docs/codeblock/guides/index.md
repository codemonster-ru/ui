---
title: "Guides"
description: "Limitations and related packages for the codeblock package"
slug: "/vueforge/codeblock/guides"
order: 6
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

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
    base: { '--vf-code-bg': '#0f172a' },
    light: { '--vf-code-border': '#cbd5e1' },
    dark: { '--vf-code-border': '#334155' }
  },
  { themeScope: '#docs-content' }
);
```

## Limitations

- Peer dependency: `vue ^3.4.0`.
- Browser-only behavior for runtime style injection (`setCodeBlockThemeVars`).

## Related Packages

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-icons`
