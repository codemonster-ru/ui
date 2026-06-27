---
title: "Installation"
description: "How to install and import the playground package"
order: 2
---

# Installation

Install the package and import the public entry points for this module.


## Install

Add the package to your project dependencies.

```bash
npm i @codemonster-ru/vueforge-playground
```

## Import

Import the public API from the package entry point.
`@codemonster-ru/vueforge-playground/ui` automatically pulls its own CSS.

```ts
import { VfPlaygroundPlugin } from '@codemonster-ru/vueforge-playground/ui';
```

The `/ui` entry wrapper is intentionally side-effectful because it loads matching CSS.

Optional manual CSS entries:

- `@codemonster-ru/vueforge-playground/style.css`
- `@codemonster-ru/vueforge-playground/tokens.css`
- `@codemonster-ru/vueforge-playground/playground.css`
- `@codemonster-ru/vueforge-playground/critical.css`

When importing granular CSS manually, load `tokens.css` before `critical.css` or `playground.css`.
