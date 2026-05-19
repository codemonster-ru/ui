---
title: "VfInput"
description: "Text input component"
slug: "/vueforge/core/components/vf-input"
order: 2
---

# VfInput

Single-line form input with VueForge theming.

## Summary

Single-line form input with VueForge theming.

## Import

```ts
import { VfInput } from '@codemonster-ru/vueforge-core';
```

## Key Props

- `modelValue?: string` (default: `''`)
- `size?: VfControlSize` (default: `md`)
- `invalid?: boolean` (default: `false`)
- `leadingIcon?: IconName | string`
- `trailingIcon?: IconName | string`
- `clearable?: boolean` (default: `false`)

## Emits

- `update:modelValue` with next input value.

## Slots

- `leading`: custom leading adornment.
- `trailing`: custom trailing adornment.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfInput
    v-model="value"
    :leading-icon="icons.envelope"
    placeholder="Your email"
    clearable
  />
</template>

<script setup>
import { ref } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfInput } from '@codemonster-ru/vueforge-core';

const value = ref('');
</script>
```
````
