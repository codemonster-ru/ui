---
title: "VfSelect"
description: "Select/dropdown input component"
slug: "/vueforge/core/components/vf-select"
order: 3
---

# VfSelect

Select control for predefined options.

## Summary

Select control for predefined options.

## Import

```ts
import { VfSelect } from '@codemonster-ru/vueforge-core';
```

## Key Props

- `modelValue?: string` (default: `''`)
- `options: VfSelectOption[]` (required)
- `size?: VfControlSize` (default: `md`)
- `invalid?: boolean` (default: `false`)
- `clearable?: boolean` (default: `false`)
- `placeholder?: string`
- `disabled?: boolean` (default: `false`)
- `placement?: VfDropdownPlacement` (default: `bottom-start`)
- `teleportTo?: string | HTMLElement | null | false`
- `disableTeleport?: boolean` (default: `false`)

## Emits

- `update:modelValue` with selected option value.

## Slots

- `leading`: custom leading adornment.
- `trailing`: custom trailing adornment.

## Usage

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSelect
    v-model="value"
    :options="options"
    placeholder="Select size"
    clearable
  />
</template>

<script setup>
import { ref } from 'vue';
import { VfSelect } from '@codemonster-ru/vueforge-core';

const value = ref('medium');
const options = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
</script>
```
````
