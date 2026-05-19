---
title: "VfAccordion"
description: "Component documentation for VfAccordion"
slug: "/vueforge/core/components/vf-accordion"
order: 12
---

# VfAccordion

## Import

```ts
import { VfAccordion } from '@codemonster-ru/vueforge-core';
```

## Summary

Collapsible section with controlled or uncontrolled open state.

## Key Props

- `open?: boolean`
- `defaultOpen?: boolean` (default: `false`)
- `title?: string`
- `disabled?: boolean` (default: `false`)

## Emits

- `update:open`
- `openChange`

## Slots

- `trigger`: gets `{ open }`
- `default`: gets `{ open }`

## Usage

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAccordion title="What is VueForge?" :default-open="true">
    VueForge is a UI toolkit with composable primitives and higher-level components.
  </VfAccordion>
</template>

<script setup>
import { VfAccordion } from '@codemonster-ru/vueforge-core';
</script>
```
````
