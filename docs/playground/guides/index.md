---
title: 'Guides'
description: 'Limitations and related packages for the playground package'
order: 6
---

# Guides

This section provides a quick overview before the detailed subsections below.

## Overview

Practical integration notes, limitations, and related packages for this package.

## Loading Strategy

`VfPlaygroundAsync` from `@codemonster-ru/vueforge-playground/ui` provides async rendering and a
skeleton fallback. Because `/ui` also exports the synchronous component and plugin, that import does
not guarantee a separate UI bundle. Dynamically import the entire `/ui` entry at a route or component
boundary when bundle-level UI deferral is required. Sandbox mode defers its runtime until a session
is created, and loads the TypeScript compiler in a dedicated Web Worker only for `.ts` files or
inline `text/typescript` scripts. Component mode and JavaScript/HTML-only sandboxes do not need the
compiler.

The current sandbox compiler payload is about 1 MiB gzip. This is an optional lazy payload, not part
of the base application graph. Keep the `/runtime` entry behind a dynamic import when direct session
creation is not required at startup.

Install `VfPlaygroundPlugin` with `app.use(...)`. It registers the component but does not install the
Core theme plugin, so configure Core and its baseline CSS separately.

## Choose an Integration

- Use [component mode](../components/playground/features.md#component-mode) for an existing Vue
  component and optional source files. It renders directly and does not load the sandbox compiler.
- Use [sandbox mode](../components/playground/features.md#sandbox-mode) for virtual HTML,
  JavaScript, TypeScript, or CSS files rendered in an iframe.
- Use the [runtime API](../api/index.md#runtime-api) when the built-in UI is not required.
- Use the [theming guide](../components/playground/theming.md) to synchronize host, CodeBlock, and
  iframe preview themes.

## Limitations

The following items are listed in this section:

- Peer dependency: `vue ^3.5.0`.
- Consumer tooling and SSR require Node.js 20 or newer.
- When wrapping/rebundling `@codemonster-ru/vueforge-playground/ui`, keep its runtime dependency path on `@codemonster-ru/vueforge-playground-core` intact.
- `/ui` and `/runtime` are the only JavaScript entries; there is no root package import.
- Node ESM `/ui` is CSS-free. Browser `/ui` always auto-loads Playground CSS; explicit CSS exports are
  for SSR client stylesheets and CSS-only use, not for disabling that browser wrapper.

## Related Packages

The following items are listed in this section:

- `@codemonster-ru/vueforge-playground-core`
- `@codemonster-ru/vueforge-playground-vite-plugin`
