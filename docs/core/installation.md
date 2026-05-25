---
title: "Installation"
description: "How to install and import the core package"
order: 2
---

# Installation

Install the package, then register the plugin in your Vue app and import base styles.


## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-core
```

## Import

Import the public API from the package entry point.

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

const app = createApp({});
app.use(VueForgeCore);
```
