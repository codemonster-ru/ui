# Features

Circular loading indicator for indeterminate work.

## Import

Import statement for this component.

```ts
import { VfProgressSpinner } from '@codemonster-ru/vueforge-core';
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
  <div style="display:flex;gap:var(--vf-surface-gap);align-items:center">
    <VfProgressSpinner label="Loading" />
    <VfProgressSpinner label="Saving" tone="success" />
    <VfProgressSpinner label="Loading details" size="2.5rem" :stroke-width="3" />
  </div>
</template>

<script setup>
import { VfProgressSpinner } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- The root uses `role="progressbar"` and exposes a configurable accessible label.
- The SVG is hidden from assistive technology because the root carries progress semantics.
- Use this component only when progress is indeterminate.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element.

| Key | Function |
| --- | --- |
| `Tab` | Not focusable by default. |
