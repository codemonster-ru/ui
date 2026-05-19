---
title: "VfTooltip"
description: "Tooltip component"
slug: "/vueforge/core/components/vf-tooltip"
order: 5
---

# VfTooltip

Context tooltip for hints and short helper text.

## Summary

Context tooltip for hints and short helper text.

## Import

```ts
import { VfTooltip } from '@codemonster-ru/vueforge-core';
```

## Key Props

- `text?: string`
- `placement?: VfTooltipPlacement` (default: `top`)
- `openDelay?: number` (default: `80`)
- `teleportTo?: string | HTMLElement | null | false`
- `disableTeleport?: boolean` (default: `false`)

## Slots

- `default`: trigger element.
- `content`: custom tooltip body.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTooltip content="Copy to clipboard">
    <VfButton variant="ghost">Hover me</VfButton>
  </VfTooltip>
</template>

<script setup>
import { VfButton, VfTooltip } from '@codemonster-ru/vueforge-core';
</script>
```
````
