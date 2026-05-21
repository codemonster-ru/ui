---
title: "Installation"
description: "How to install and import the core package"
order: 2
---

# Installation

## Overview

Install the package and import the public entry points.


## Install

```bash
npm i @codemonster-ru/vueforge-core
```

## Import

```ts
import { createApp } from 'vue';
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

const app = createApp({});
app.use(VueForgeCore);
```

