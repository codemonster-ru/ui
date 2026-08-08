---
title: 'Installation'
description: 'How to install and import the playground package'
order: 2
---

# Installation

Install the package and import the public entry points for this module.

## Requirements

- Node.js 20 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.
- A direct `@codemonster-ru/vueforge-core` dependency for theme and baseline CSS setup.

## Install

Use the package manager already used by the application:

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core@^2.0.0 @codemonster-ru/vueforge-playground
```

## Import

The package has no root export. Import the public UI API from `/ui`.
`@codemonster-ru/vueforge-playground/ui` automatically pulls its own CSS.

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';
import { VfPlaygroundPlugin } from '@codemonster-ru/vueforge-playground/ui';

const app = createApp({});
app.use(VueForgeCore);
app.use(VfPlaygroundPlugin);
```

The `/ui` entry wrapper is intentionally side-effectful because it loads matching CSS.

Explicit CSS entries:

- `@codemonster-ru/vueforge-playground/style.css`
- `@codemonster-ru/vueforge-playground/tokens.css`
- `@codemonster-ru/vueforge-playground/playground.css`
- `@codemonster-ru/vueforge-playground/critical.css`

The public browser `/ui` entry always uses its auto-CSS wrapper. These explicit entries are for SSR
client stylesheets and CSS-only use; they do not provide a CSS-free public browser UI entry. When
composing granular CSS, load `tokens.css` before `critical.css` or `playground.css`.

Core full CSS is the simplest supported baseline because Playground renders Core tabs internally.
For a granular application, provide Core `tokens.css`, `theme.css`, `base.css`, and `tabs.css`.

## Lazy loading and SSR

`VfPlaygroundAsync` provides async rendering and a skeleton fallback. Because `/ui` also exports the
synchronous component and plugin, importing the wrapper from `/ui` does not guarantee a separate UI
bundle. Dynamically import the entire `/ui` entry at a route or component boundary when bundle-level
UI deferral is required.

Sandbox mode defers Playground Core until a session is created. Its TypeScript compiler is loaded
in a dedicated Web Worker only for `.ts` files or inline `text/typescript` scripts. Component mode
and JavaScript/HTML-only sandboxes do not download the current compiler worker of about 1 MiB gzip.

The package is ESM-only. SSR preserves the initial markup and starts iframe/session work after mount.
Node ESM `/ui` is CSS-free, so keep Core and Playground CSS imports in the client entry. Use
`@codemonster-ru/vueforge-playground/runtime` only for direct session creation.
