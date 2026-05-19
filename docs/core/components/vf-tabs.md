---
title: "VfTabs"
description: "Component documentation for VfTabs"
slug: "/vueforge/core/components/vf-tabs"
order: 27
---

# VfTabs

## Import

```ts
import { VfTabs } from '@codemonster-ru/vueforge-core';
```

## Summary

Tabs component with controlled/uncontrolled active value.

## Key Props

- `items: VfTabItem[]`
- `modelValue?: string`
- `defaultValue?: string`

## Emits

- `update:modelValue`
- `change`

## Slots

- `tab`: custom tab node (`{ item, isActive, index }`).
- `panel`: custom panel node (`{ activeValue }`).

## Usage

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTabs v-model="active" :items="items" />
</template>

<script setup>
import { ref } from 'vue';
import { VfTabs } from '@codemonster-ru/vueforge-core';

const active = ref('overview');
const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'api', label: 'API' },
  { value: 'examples', label: 'Examples' },
];
</script>
```
````
