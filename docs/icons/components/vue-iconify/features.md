# Features

Core usage patterns for rendering, sizing, and animating icons.

## Import

Import statement for this component.

```ts
import { VueIconify } from '@codemonster-ru/vueforge-icons';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:var(--vf-surface-padding-compact);font-size:var(--vf-text-title-font-size);align-items:center">
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

## Behavior Notes

The following items are listed in this section:

- Unknown icon names fallback safely to `moon`.
- Kebab-case icon names are normalized to component file names.
- `inset` adjusts visual scale and is clamped to a safe range.
