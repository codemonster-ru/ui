# Features

Linear progress indicator.

## Import

Import statement for this component.

```ts
import { VfProgressBar } from '@codemonster-ru/vueforge-core';
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
  <div style="display:grid;gap:var(--vf-surface-gap);max-width:24rem">
    <VfProgressBar :value="42" label="Import progress" />
    <VfProgressBar :value="7" :max="12" show-value label="Step progress" />
    <VfProgressBar :value="64" tone="success" label="Validation progress" />
    <VfProgressBar indeterminate label="Sync in progress" />
  </div>
</template>

<script setup>
import { VfProgressBar } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- The root uses `role="progressbar"` and exposes a configurable accessible label.
- Determinate progress exposes `aria-valuemin`, `aria-valuemax`, and a bounded `aria-valuenow`.
- Indeterminate progress omits current value attributes because no reliable completion value is available.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element.

| Key | Function |
| --- | --- |
| `Tab` | Not focusable by default. |
