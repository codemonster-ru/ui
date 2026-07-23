---
title: 'Guides'
description: 'Limitations and related packages for the core package'
order: 6
---

# Guides

This section provides a quick overview before the detailed subsections below.

## Overview

Practical integration notes, limitations, and related packages for this package.

## Common Integration Patterns

These practices help keep setup predictable across application and package boundaries.

### Configure Theme at App Root

Install the Core plugin once when the application needs theme configuration or shared defaults
for `VfThemeProvider`.

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

createApp(App).use(VueForgeCore);
```

The plugin configures the theme runtime; it does not register components. Import components
directly from the package root or from their component subpaths.

### Choose CSS Entry by Scope

The following items are listed in this section:

- Component subpath imports (`@codemonster-ru/vueforge-core/button`, `.../dialog`) auto-load matching
  component CSS. Add the shared `tokens.css`, `theme.css`, and `base.css` entries once.
- `styles.css`: the opt-in full core stylesheet, including global baseline and every component style.
- `foundation.css`: foundation-only layer for incremental adoption.
- `tokens.css` + `theme.css`: when you need token/theme control separately.
- Component CSS entries (`button.css`, `dialog.css`, `tabs.css`, etc.) pair with named component
  imports from the CSS-free package root for fully manual delivery. Browser component subpaths always
  auto-load their CSS.

### Adopt Incrementally

Start with foundation/composables (`useBreakpointValue`, `useScrollLock`), then migrate component by component.

### Async Loading + Ready Gating

For heavy lazy-loaded UI (playgrounds, editors, large demo blocks), use the dedicated recipe:

- [SkeletonGate + Async Recipe](/core/guides/skeleton-gate-async-recipe)

### Color Architecture

For the primitive, semantic, component, and VueForge 1.x compatibility layers, see:

- [Color Tokens](/core/guides/color-tokens)

### Theme Configuration

For runtime overrides, light/dark/system mode, scoped themes, custom prefixes, and static fallback
behavior, see:

- [Theme Configuration](/core/guides/theme-configuration)

### Accessibility

For keyboard, focus, ARIA, reduced-motion, forced-colors, RTL, screen-reader, and WCAG integration
guidance, see:

- [Accessibility](/core/guides/accessibility)

### SSR and Hydration

For Vue SSR, Vite SSR, Nuxt, theme bootstrap, Teleports, CodeBlock, and Playground, see:

- [SSR and Hydration](/core/guides/ssr)

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Theme/foundation CSS usage should be documented per entry export.
- Nuxt integration is manual; VueForge does not currently ship a Nuxt module or Nuxt end-to-end
  fixture.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-theme`: shared theme engine.
- `@codemonster-ru/vueforge-layouts`: layout primitives built for the same ecosystem.
