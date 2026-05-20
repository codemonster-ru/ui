---
title: "VueIconify"
description: "Universal icon rendering component"
slug: "/vueforge/icons/components/vue-iconify"
order: 1
---

# VueIconify

Renders icons from the VueForge icon set via a unified API.

## Summary

Renders icons from the VueForge icon set via a unified API.

## Import

```ts
import { VueIconify } from '@codemonster-ru/vueforge-icons';
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `icon?` | `IconName \| string` | `moon` | Icon name or custom icon identifier. |
| `size?` | `number \| string` | `var(--vf-icon-size-md)` | Size token for spacing and dimensions. |
| `spin?` | `boolean` | `false` | Applies continuous rotation animation. |
| `style?` | `'solid'` | `solid` | Icon visual style variant. |
| `inset?` | `number` | `0` | Scales icon with optical inset compensation. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

| Name | Values |
| --- | --- |
| `IconName` | `Union of generated icon names.` |
| `IconCatalogEntry` | `{ title; keywords; style; brand? }` |
| `IconShowcaseEntry` | `{ icon; status; note }` |

## Notes

- Unknown icon names fallback safely to `moon`.
- Kebab-case icon names are normalized to component file names.
- `inset` adjusts visual scale and is clamped to a safe range.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;font-size:24px;align-items:center">
    <VueIconify icon="github" />
    <VueIconify icon="sparkles" spin />
    <VueIconify icon="arrowRightLong" />
  </div>
</template>

<script setup>
import { VueIconify } from '@codemonster-ru/vueforge-icons';
</script>
```
````
