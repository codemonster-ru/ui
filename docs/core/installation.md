---
title: "Installation"
description: "How to install and import the core package"
order: 2
---

# Installation

Install the package, then import the components and CSS needed by your app. Install the
configuration plugin when you need app-wide theme configuration or theme-provider defaults.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

Use the package manager already used by the application:

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-core
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-core
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-core
```

## Full CSS setup

The optional plugin resolves and applies the configured theme variables and provides defaults
to `VfThemeProvider`. It does not globally register VueForge components.

Plugin setup with the complete core stylesheet:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

const app = createApp({});
app.use(VueForgeCore);
```

`styles.css` is the complete baseline, theme, and component stylesheet. Import it once in the
browser/client entry.

## Granular CSS setup

Component-level imports with auto CSS:

```ts
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import { VfDialog } from '@codemonster-ru/vueforge-core/dialog';
```

Each component subpath import pulls matching component CSS automatically, including
the transition states required by animated overlays.

Auto CSS contains the selected component rules, not the complete token and baseline stylesheet. A
granular application should install the Core plugin and import its shared foundation entries once:

```ts
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';
```

Components are regular Vue component exports. Register an imported component locally, use it
from `<script setup>`, or explicitly add it to `app.component(...)` if your application needs
global registration.

For fully manual CSS delivery, import named components from the CSS-free package root and add their
component CSS explicitly. Browser component subpaths always select their auto-CSS wrappers.

```ts
import { VfButton } from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-core/button.css';
```

Do not combine `styles.css` with granular component CSS: the full stylesheet already contains every
component rule.

## SSR

The root, foundation, and theme entries support ESM and CommonJS SSR. Component subpaths select
CSS-free ESM files under the Node condition and auto-CSS wrappers in browser builds. Import CSS from
the client entry; do not rely on a server import to inject styles.
