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

Import the plugin from the package entry point, or import layout components from JS subpaths with auto-CSS.

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/base.css';
import '@codemonster-ru/vueforge-layouts/tokens.css';
import '@codemonster-ru/vueforge-layouts/theme.css';
import '@codemonster-ru/vueforge-layouts/app-shell.css';

createApp({}).use(VueForgeLayouts);
```

Component-level JS subpaths (auto-import matching component CSS):

```ts
import VfAppShell from '@codemonster-ru/vueforge-layouts/app-shell';
import VfContainer from '@codemonster-ru/vueforge-layouts/container';
```

For full manual control, keep explicit CSS imports and load only required entries on pages where they are used.

Examples:

- `@codemonster-ru/vueforge-layouts/container.css`
- `@codemonster-ru/vueforge-layouts/content-area.css`
- `@codemonster-ru/vueforge-layouts/document-layout.css`
