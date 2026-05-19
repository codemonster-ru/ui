---
title: "VfNavMenu"
description: "Component documentation for VfNavMenu"
slug: "/vueforge/core/components/vf-nav-menu"
order: 28
---

# VfNavMenu

## Import

```ts
import { VfNavMenu } from '@codemonster-ru/vueforge-core';
```

## Summary

Hierarchical navigation menu with single or multiple expanded branches.

## Key Props

- `items: VfNavMenuItem[]` (required)
- `modelValue?: string`
- `defaultValue?: string`
- `ariaLabel?: string` (default: `Navigation`)
- `expandMode?: 'multiple' | 'single'` (default: `multiple`)
- `variant?: 'default' | 'pills'` (default: `default`)

## Emits

- `update:modelValue`: fires when active item changes.
- `change`: fires with selected item value.
- `select`: fires with full selected item object.

## Slots

- No public slots. Rendering is driven by the `items` tree.

## Usage

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="max-width:340px">
    <VfNavMenu
      v-model="active"
      :items="items"
      expand-mode="single"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfNavMenu } from '@codemonster-ru/vueforge-core';

const active = ref('guides-installation');

const items = [
  {
    value: 'getting-started',
    label: 'Getting Started',
    children: [
      { value: 'guides-installation', label: 'Installation' },
      { value: 'guides-configuration', label: 'Configuration' },
    ],
  },
  {
    value: 'components',
    label: 'Components',
    children: [
      { value: 'button', label: 'Button' },
      { value: 'dropdown', label: 'Dropdown' },
      { value: 'popover', label: 'Popover' },
    ],
  },
];
</script>
```
````
