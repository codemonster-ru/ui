---
title: "Getting started"
description: "Overview and purpose of the core package"
order: 1
---

# Getting started

Foundation package for VueForge UI: components, composables, breakpoints/foundation helpers, and theme provider/runtime integration for Vue 3 apps.

Core exposes a theme/configuration plugin and direct component imports. The plugin does not
globally register components; import the components you use from the root package or from a
component subpath.

For optimized bundles, prefer component subpath imports (for example
`@codemonster-ru/vueforge-core/button`) so CSS is linked automatically per component.
