---
title: "VfButton"
description: "Action button component"
slug: "/vueforge/core/components/vf-button"
order: 1
---

# VfButton

Primary action component for forms, dialogs, and toolbar actions.

## Summary

Primary action component for forms, dialogs, and toolbar actions.

## Import

```ts
import { VfButton } from '@codemonster-ru/vueforge-core';
```

## Key Props

- `variant?: VfButtonVariant` (default: `primary`)
- `size?: VfControlSize` (default: `md`)
- `block?: boolean` (default: `false`)
- `type?: 'button' | 'submit' | 'reset'` (default: `button`)

## Slots

- `default`: button content.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:10px;align-items:center">
    <VfButton variant="solid">Save</VfButton>
    <VfButton variant="ghost">Cancel</VfButton>
  </div>
</template>

<script setup>
import { VfButton } from '@codemonster-ru/vueforge-core';
</script>
```
````
