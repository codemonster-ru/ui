---
title: "Guides"
description: "Limitations and related packages for the playground-vite-plugin package"
order: 5
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

### Use a Dedicated Virtual Prefix for Docs

Avoid collisions with other virtual modules by reserving a docs-specific prefix.

```ts
vueforgePlaygroundVirtualPlugin({
  virtualPrefix: 'virtual:docs/',
  entries: {
    'playground/button': './src/demos/ButtonDemo.vue'
  }
});
```

### Keep Entry IDs Stable

Use deterministic ids (`playground/button`, `playground/theme`) so markdown examples stay valid after refactors.

### Pick Export Mode by File Shape

- Use `'default'` for Vue SFC demo modules.
- Use `{ named: '...' }` for token/constants files.
- Use `'namespace'` for utility modules with multiple exports.

## Limitations

- Peer dependency: `vite ^6 || ^7 || ^8`.
- Intended for Vite virtual-module workflows.

## Related Packages

- `@codemonster-ru/vueforge-playground`
- `@codemonster-ru/vueforge-playground-core`
