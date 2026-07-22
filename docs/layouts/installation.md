---
title: 'Installation'
description: 'How to install and import the layouts package'
order: 2
---

# Installation

Install the package and import the public entry points for this module.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.
- `@codemonster-ru/vueforge-core` `^1.36.0`.

## Install

Install Core as a direct dependency because it is a Layouts peer:

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0 @codemonster-ru/vueforge-layouts
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0 @codemonster-ru/vueforge-layouts
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core@^1.36.0 @codemonster-ru/vueforge-layouts
```

## Full CSS setup

Import the root plugin plus Core and Layouts full stylesheets. The plugin installs Core theme
configuration but does not globally register layout components.

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-core/styles.css';
import '@codemonster-ru/vueforge-layouts/styles.css';

createApp({}).use(VueForgeLayouts);
```

## Granular CSS setup

Import the Core and Layouts shared foundation entries once. Component subpaths do not include them:

```ts
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-layouts/tokens.css';
import '@codemonster-ru/vueforge-layouts/theme.css';
import '@codemonster-ru/vueforge-layouts/base.css';
```

Component-level JS subpaths (auto-import matching component CSS):

```ts
import VfAppShell from '@codemonster-ru/vueforge-layouts/app-shell';
import VfAdminLayout from '@codemonster-ru/vueforge-layouts/admin-layout';
import VfAdminShell from '@codemonster-ru/vueforge-layouts/admin-shell';
import VfContainer from '@codemonster-ru/vueforge-layouts/container';
```

Subpath wrappers are intentionally side-effectful because they load matching CSS.
Wrappers also include CSS for components rendered internally. For example,
`@codemonster-ru/vueforge-layouts/document-layout` loads both `container.css` and
`document-layout.css`.
`@codemonster-ru/vueforge-layouts/auth-layout` loads both `container.css` and `auth-layout.css`.
`@codemonster-ru/vueforge-layouts/setup-layout` follows the same pattern and loads both
`container.css` and `setup-layout.css`.
`@codemonster-ru/vueforge-layouts/admin-layout` loads `admin-layout.css`.
`@codemonster-ru/vueforge-layouts/admin-shell` loads `admin-shell.css`.

Node ESM subpath conditions are CSS-free for SSR. For fully manual browser delivery, import named
components from the CSS-free package root and add only the component CSS used by a page. Browser
component subpaths always select auto-CSS wrappers, so do not combine them with explicit matching
component CSS.

Examples:

- `@codemonster-ru/vueforge-layouts/breakpoints.css`
- `@codemonster-ru/vueforge-layouts/container.css`
- `@codemonster-ru/vueforge-layouts/admin-layout.css`
- `@codemonster-ru/vueforge-layouts/admin-shell.css`
- `@codemonster-ru/vueforge-layouts/content-area.css`
- `@codemonster-ru/vueforge-layouts/auth-layout.css` (with `container.css`)
- `@codemonster-ru/vueforge-layouts/document-layout.css`
- `@codemonster-ru/vueforge-layouts/setup-layout.css`

## SSR

The root entry supports ESM and CommonJS. Component subpaths select CSS-free Node ESM files and
auto-CSS browser files. Keep CSS imports in the client entry and use the same theme configuration on
server and client.
