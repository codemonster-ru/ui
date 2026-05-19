---
title: "ComponentName"
description: "Component documentation template"
slug: "/vueforge/package-name/components/component-name"
order: 1
---

# ComponentName

## Summary

Short summary of what this component does.

## Import

```ts
import { ComponentName } from '@codemonster-ru/package-name';
```

## Key Props

- `prop?: string`

## Emits

- `update:modelValue`

## Slots

- `default`

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <ComponentName />
</template>

<script setup>
import { ComponentName } from '@codemonster-ru/package-name';
</script>
```
````
