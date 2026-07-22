---
title: "Installation"
description: "How to install and import the codeblock package"
order: 2
---

# Installation

Install the package and import the public entry points for this module.

## Requirements

- Node.js 20 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

Use the package manager already used by the application:

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-codeblock
```

## Import

The package has no root export. Import the component/plugin API from `/view`.
`@codemonster-ru/vueforge-codeblock/view` automatically pulls its own CSS.

```ts
import { createApp } from 'vue';
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock/view';

createApp({}).use(VueForgeCodeBlock);
```

Explicit CSS entries:

- `@codemonster-ru/vueforge-codeblock/style.css`
- `@codemonster-ru/vueforge-codeblock/tokens.css`
- `@codemonster-ru/vueforge-codeblock/codeblock.css`
- `@codemonster-ru/vueforge-codeblock/critical.css`

The browser `/view` entry always uses its auto-CSS wrapper. These explicit entries are for SSR client
stylesheets and CSS-only use; they do not provide a CSS-free public browser component entry. When
composing granular CSS, load `tokens.css` before `critical.css` or `codeblock.css`. The package token
entry contains standalone fallbacks, so Core CSS is optional and does not need to load first.

The separate `/highlight` entry exports async highlighting helpers and does not load component CSS.
Shiki core, its engine, and language grammars remain split into dynamic chunks. `allowedLanguages`
limits which grammar chunks are requested at runtime, not which chunks the bundler emits.

## SSR

Vue server rendering can await finalized highlighting through server prefetch. Node ESM and CommonJS
`/view` imports are CSS-free; import `style.css` from the client stylesheet of an SSR application.
