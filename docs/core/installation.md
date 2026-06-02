---
title: "Installation"
description: "How to install and import the core package"
order: 2
---

# Installation

Install the package, then register the plugin in your Vue app.

## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-core
```

## Import

Plugin setup with global foundation styles:

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';

const app = createApp({});
app.use(VueForgeCore);
```

Component-level imports with auto CSS:

```ts
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import { VfDialog } from '@codemonster-ru/vueforge-core/dialog';
```

Each component subpath import pulls matching component CSS automatically, including
the transition states required by animated overlays.
