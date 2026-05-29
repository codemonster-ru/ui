---
title: "Installation"
description: "How to install and import the layouts package"
order: 2
---

# Installation

Install the package and import the public entry points for this module.

## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-layouts
```

## Import

Import the public API from the package entry point and choose explicit style entry files.

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/base.css';
import '@codemonster-ru/vueforge-layouts/tokens.css';
import '@codemonster-ru/vueforge-layouts/theme.css';
import '@codemonster-ru/vueforge-layouts/app-shell.css';

createApp({}).use(VueForgeLayouts);
```

For smaller payloads, import only required layout entries on the routes/pages where they are used.

Examples:

- `@codemonster-ru/vueforge-layouts/container.css`
- `@codemonster-ru/vueforge-layouts/content-area.css`
- `@codemonster-ru/vueforge-layouts/document-layout.css`
