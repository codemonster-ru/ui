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
import VfAdminLayout from '@codemonster-ru/vueforge-layouts/admin-layout';
import VfContainer from '@codemonster-ru/vueforge-layouts/container';
```

Subpath wrappers are intentionally side-effectful because they load matching CSS.
Wrappers also include CSS for components rendered internally. For example,
`@codemonster-ru/vueforge-layouts/document-layout` loads both `container.css` and
`document-layout.css`.
`@codemonster-ru/vueforge-layouts/setup-layout` follows the same pattern and loads both
`container.css` and `setup-layout.css`.
`@codemonster-ru/vueforge-layouts/admin-layout` loads `admin-layout.css`.

For full manual control, keep explicit CSS imports and load only required entries on pages where they are used.

Examples:

- `@codemonster-ru/vueforge-layouts/container.css`
- `@codemonster-ru/vueforge-layouts/admin-layout.css`
- `@codemonster-ru/vueforge-layouts/content-area.css`
- `@codemonster-ru/vueforge-layouts/document-layout.css`
- `@codemonster-ru/vueforge-layouts/setup-layout.css`
