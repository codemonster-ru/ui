---
title: "Installation"
description: "How to install and import the codeblock package"
slug: "/vueforge/codeblock/installation"
order: 2
---

# Installation

## Overview

Install the package and import the public entry points.


## Install

```bash
npm i @codemonster-ru/vueforge-codeblock
```

## Import

```ts
import { createApp } from 'vue';
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock';
import '@codemonster-ru/vueforge-codeblock/style.css';

createApp({}).use(VueForgeCodeBlock);
```

