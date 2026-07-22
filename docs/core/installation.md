---
title: "Installation"
description: "How to install and import the core package"
order: 2
---

# Installation

Install the package, then import the components and CSS needed by your app. Install the
configuration plugin when you need app-wide theme configuration or theme-provider defaults.

## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-core
```

## Configure the Theme

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

## Import Components

Component-level imports with auto CSS:

```ts
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import { VfDialog } from '@codemonster-ru/vueforge-core/dialog';
```

Each component subpath import pulls matching component CSS automatically, including
the transition states required by animated overlays.

Components are regular Vue component exports. Register an imported component locally, use it
from `<script setup>`, or explicitly add it to `app.component(...)` if your application needs
global registration.

Use either `styles.css` for the complete baseline or component subpaths for a granular bundle. For manual control, import `base.css`, `tokens.css`, `theme.css`, and individual component CSS entries explicitly.
