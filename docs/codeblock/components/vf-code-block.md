---
title: "VfCodeBlock"
description: "Syntax-highlighted code block component"
slug: "/vueforge/codeblock/components/vf-code-block"
order: 1
---

# VfCodeBlock

Standalone code block component with optional header, line numbers, copy action, and theme-aware rendering.

## Summary

Standalone code block component with optional header, line numbers, copy action, and theme-aware rendering.

## Import

```ts
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';
```

## Key Props

- `code?: string` (default: `''`)
- `language?: CodeBlockLanguage` (default: `plaintext`)
- `filename?: string` (default: `''`)
- `showHeader?: boolean` (default: `true`)
- `showLineNumbers?: boolean` (default: `false`)
- `copyable?: boolean` (default: `true`)
- `copyLabel?: string` (default: `Copy`)
- `copiedLabel?: string` (default: `Copied`)
- `copiedDuration?: number` (default: `1200`)
- `theme?: 'inherit' | 'light' | 'dark'` (default: `inherit`)
- `wrap?: boolean` (default: `false`)
- `highlight?: boolean` (default: `true`)
- `maxHeight?: string`
- `ariaLabel?: string` (default: `Code block`)

## Emits

- `copy` with payload `{ text: string }`.

## Slots

- `actions`: custom controls in header action area.

## Notes

- When `theme="inherit"`, component tracks nearest `data-theme` / `data-vf-theme`.
- Highlighting is async; plain-code fallback is rendered first for responsiveness.

## Usage

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCodeBlock
    language="ts"
    filename="math.ts"
    :code="code"
    show-line-numbers
    copyable
  />
</template>

<script setup>
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';

const code = `export const sum = (a: number, b: number) => a + b;`;
</script>
```
````
