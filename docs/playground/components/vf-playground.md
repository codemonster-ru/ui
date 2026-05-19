---
title: "VfPlayground"
description: "Interactive sandbox/component demo container"
slug: "/vueforge/playground/components/vf-playground"
order: 1
---

# VfPlayground

Interactive renderer for sandbox files or component demos, powered by `@codemonster-ru/vueforge-playground-core`.

## Summary

Interactive renderer for sandbox files or component demos, powered by `@codemonster-ru/vueforge-playground-core`.

## Import

```ts
import { VfPlayground } from '@codemonster-ru/vueforge-playground';
```

## Key Props

Shared:

- `height?: string | number`
- `theme?: 'inherit' | 'light' | 'dark'`
- `initialTab?: 'code' | 'preview' | 'console'`
- `tabsRenderer?`, `actionsRenderer?`, `filesRenderer?`

Sandbox mode:

- `mode?: 'sandbox'`
- `files: PlaygroundFiles`
- `entry: string`
- `framework?: 'vanilla' | 'vue' | 'html'`
- `autorun?: boolean`
- `showCode?: boolean`
- `resolveImport?`
- `bootstrapScript?`

Component mode:

- `mode: 'component'`
- `component: Component`
- `componentSource?`
- `componentSourceLanguage?`
- `componentFiles?`
- `componentEntry?`
- `componentPadding?`
- `componentMinHeight?`

## Emits

- `run`
- `error` with `PlaygroundError`

## Slots

- `layout`: full custom layout slot with runtime state/actions.

## Notes

- In `sandbox` mode, preview is rendered in an iframe.
- In `component` mode, preview renders the provided Vue component directly.

## Usage

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPlayground mode="sandbox" :files="files" entry="/App.vue" :height="280" />
</template>

<script setup>
import { VfPlayground } from '@codemonster-ru/vueforge-playground';

const files = {
  '/App.vue': `<template><button>Playground demo</button></template>`
};
</script>
```
````
