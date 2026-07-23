---
title: 'Getting started'
description: 'Overview and purpose of the core package'
order: 1
---

# Getting started

Core is the foundation package for VueForge UI: accessible components, composables,
breakpoint/foundation helpers, and theme integration for Vue 3.5 applications.

Core exposes a theme/configuration plugin and direct component imports. The plugin does not
globally register components; import the components you use from the root package or from a
component subpath.

For optimized bundles, prefer component subpath imports (for example
`@codemonster-ru/vueforge-core/button`) so CSS is linked automatically per component.

Continue with:

- [Installation](./installation.md) for npm, pnpm, Yarn, full CSS, granular CSS, and SSR setup.
- [Theme Configuration](./guides/theme-configuration.md) for `VfThemeProvider`, mode switching,
  runtime presets, scoped themes, custom prefixes, and static fallback behavior.
- [Components](./components/button/index.md) for the first component guide and links to its API.
- [Accessibility](./guides/accessibility.md) and [SSR and Hydration](./guides/ssr.md) for
  application-level integration requirements.
- [Public API](./api/index.md) for plugins, components, composables, foundation helpers, and types.
