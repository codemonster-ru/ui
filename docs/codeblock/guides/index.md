---
title: 'Guides'
description: 'Limitations and related packages for the codeblock package'
order: 6
---

# Guides

Integration notes for using `@codemonster-ru/vueforge-codeblock` in real projects and docs environments.

## Overview

Practical integration notes, limitations, and related packages for this package.

## Common Integration Patterns

Use these patterns as a baseline for stable integration in apps and docs portals.

### Use with VueForge Core Theme Provider

With `theme="inherit"`, `VfCodeBlock` resolves the nearest ancestor carrying a valid
`data-vf-theme`. `VfThemeProvider` synchronizes that canonical attribute and any explicitly
configured theme attributes on its configured root; component nesting alone does not create a
local boundary.

```ts
import { VfThemeProvider } from '@codemonster-ru/vueforge-core';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
```

In inherited mode the host keeps `data-vf-theme="inherit"`. Inspect `data-vf-resolved-theme` for
the effective `light` or `dark` mode.

### Scope Runtime Theme Vars to Docs Area

For docs portals, avoid polluting global `:root` and scope variables to a container.

```ts
import { setCodeBlockThemeVars } from '@codemonster-ru/vueforge-codeblock/view';

setCodeBlockThemeVars(
  {
    base: {
      '--vf-codeblock-border-color': 'var(--vf-color-border-default)',
    },
    light: {
      '--vf-codeblock-background-color': 'var(--vf-color-background-surface-subtle)',
    },
    dark: {
      '--vf-codeblock-background-color': 'var(--vf-color-background-surface-subtle)',
    },
  },
  { themeScope: '#docs-content' },
);
```

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Browser-only behavior for runtime style injection (`setCodeBlockThemeVars`).

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-core`
- `@codemonster-ru/vueforge-icons`
