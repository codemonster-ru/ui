---
title: "VfSwitch"
description: "Component documentation for VfSwitch"
slug: "/vueforge/core/components/vf-switch"
order: 33
---

# VfSwitch

## Import

```ts
import { VfSwitch } from '@codemonster-ru/vueforge-core';
```

## Summary

Boolean switch with label and custom thumb slot support.

## Key Props

- `modelValue?: boolean` (default: `false`)
- `size?: VfControlSize` (default: `md`)
- `static?: boolean` (default: `false`)
- `thumbContrast?: VfSwitchThumbContrast` (default: `auto`)
- `invalid?: boolean` (default: `false`)
- `disabled?: boolean` (default: `false`)
- `label?: string`

## Emits

- `update:modelValue`
- `change`

## Slots

- `default`: label content.
- `thumb`: gets `{ checked }`.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSwitch v-model="enabled" label="Notifications" />
</template>

<script setup>
import { ref } from 'vue';
import { VfSwitch } from '@codemonster-ru/vueforge-core';

const enabled = ref(true);
</script>
```
````
