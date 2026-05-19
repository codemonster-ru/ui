---
title: "VfRadio"
description: "Component documentation for VfRadio"
slug: "/vueforge/core/components/vf-radio"
order: 20
---

# VfRadio

## Import

```ts
import { VfRadio } from '@codemonster-ru/vueforge-core';
```

## Summary

Single radio option for grouped single-choice selection.

## Key Props

- `modelValue?: string | number | boolean`
- `value: string | number | boolean`
- `size?: VfControlSize` (default: `md`)
- `invalid?: boolean` (default: `false`)
- `disabled?: boolean` (default: `false`)
- `label?: string`

## Emits

- `update:modelValue`
- `change`

## Slots

- `default`: label content.

## Usage

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:8px">
    <VfRadio v-model="size" name="size" value="s" label="Small" />
    <VfRadio v-model="size" name="size" value="m" label="Medium" />
    <VfRadio v-model="size" name="size" value="l" label="Large" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfRadio } from '@codemonster-ru/vueforge-core';

const size = ref('m');
</script>
```
````
