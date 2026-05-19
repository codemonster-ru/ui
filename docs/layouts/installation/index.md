---
title: "Installation"
description: "How to install and import the layouts package"
slug: "/vueforge/layouts/installation"
order: 2
---

# Installation

## Overview

Install the package and import the public entry points.


## Install

```bash
npm i @codemonster-ru/vueforge-layouts
```

## Import

```ts
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';
import '@codemonster-ru/vueforge-layouts/styles.css';

createApp({}).use(VueForgeLayouts);
```

