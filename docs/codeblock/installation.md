---
title: "Installation"
description: "How to install and import the codeblock package"
order: 2
---

# Installation

Install the package and import the public entry points for this module.


## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-codeblock
```

## Import

Import the public API from the package entry point.
`@codemonster-ru/vueforge-codeblock/view` automatically pulls its own CSS.

```ts
import { createApp } from 'vue';
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock/view';

createApp({}).use(VueForgeCodeBlock);
```

Optional manual CSS entries:

- `@codemonster-ru/vueforge-codeblock/style.css`
- `@codemonster-ru/vueforge-codeblock/codeblock.css`
- `@codemonster-ru/vueforge-codeblock/critical.css`
