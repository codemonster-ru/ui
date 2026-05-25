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

Import the public API from the package entry point.

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/styles.css';

createApp({}).use(VueForgeLayouts);
```
