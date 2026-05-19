---
title: "VfTextarea"
description: "Component documentation for VfTextarea"
slug: "/vueforge/core/components/vf-textarea"
order: 39
---

# VfTextarea

## Import

```ts
import { VfTextarea } from '@codemonster-ru/vueforge-core';
```

## Summary

Multiline text input with size and validation states.

## Key Props

- `modelValue?: string` (default: `''`)
- `size?: VfControlSize` (default: `md`)
- `invalid?: boolean` (default: `false`)

## Emits

- `update:modelValue`

## Slots

- No slots.

## Usage

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTextarea
    v-model="bio"
    rows="4"
    placeholder="Tell us about your project..."
  />
</template>

<script setup>
import { ref } from 'vue';
import { VfTextarea } from '@codemonster-ru/vueforge-core';

const bio = ref('');
</script>
```
````
