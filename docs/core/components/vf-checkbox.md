---
title: "VfCheckbox"
description: "Component documentation for VfCheckbox"
slug: "/vueforge/core/components/vf-checkbox"
order: 7
---

# VfCheckbox

## Import

```ts
import { VfCheckbox } from '@codemonster-ru/vueforge-core';
```

## Summary

Boolean input control with label support.

## Key Props

- `modelValue?: boolean` (default: `false`)
- `size?: VfControlSize` (default: `md`)
- `invalid?: boolean` (default: `false`)
- `disabled?: boolean` (default: `false`)
- `label?: string`

## Emits

- `update:modelValue` with checked state.
- `change` with checked state.

## Slots

- `default`: label content.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCheckbox v-model="agreed" label="I agree to terms" />
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox } from '@codemonster-ru/vueforge-core';

const agreed = ref(true);
</script>
```
````
