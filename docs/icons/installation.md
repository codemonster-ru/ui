---
title: 'Installation'
description: 'How to install and import the icons package'
order: 2
---

# Installation

Install the package, then import `VueIconify` from its public root entry.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

## Quick start

The browser entry includes the component styles automatically:

```vue
<script setup lang="ts">
import { VueIconify } from '@codemonster-ru/vueforge-icons';
</script>

<template>
  <VueIconify icon="check" aria-hidden="true" />
</template>
```

Use `aria-hidden="true"` for decorative icons. For an icon that conveys meaning without adjacent
text, pass an accessible name to the inner SVG:

```vue
<VueIconify icon="warning" role="img" aria-label="Warning" />
```

## CSS and SSR

Direct Node ESM and CommonJS imports are CSS-free so SSR does not need a CSS loader. Add the public
stylesheet to the client entry of an SSR application:

```ts
import '@codemonster-ru/vueforge-icons/style.css';
```

Do not add this explicit stylesheet when the normal browser root entry already supplies the same
CSS.

See the [public API](./api/index.md), [integration guides](./guides/index.md), and
[full icon catalog](./icons.md) for the available exports and usage patterns.
