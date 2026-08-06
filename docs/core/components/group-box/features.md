# Features

Outlined content group with a title embedded in its border and optional disclosure behavior.

## Import

```ts
import { VfGroupBox } from '@codemonster-ru/vueforge-core';
```

The standalone entry automatically includes the component styles:

```ts
import { VfGroupBox } from '@codemonster-ru/vueforge-core/group-box';
```

## Basic

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<script setup>
import { VfGroupBox } from '@codemonster-ru/vueforge-core';
</script>

<template>
  <VfGroupBox title="Shipping address">
    <p style="margin: 0">1234 Elm Street, San Francisco, CA 94102</p>
  </VfGroupBox>
</template>
```
````

## Collapsible

Use `collapsible` with `v-model:collapsed` when users should be able to hide the content.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VfGroupBox } from '@codemonster-ru/vueforge-core';

const collapsed = ref(false);
</script>

<template>
  <VfGroupBox v-model:collapsed="collapsed" title="Invoice details" collapsible> Invoice #1024 </VfGroupBox>
</template>
```

Use `defaultCollapsed` instead for an initially collapsed uncontrolled component.

## Accessibility

- The root uses native `fieldset` semantics and the title uses `legend`.
- In collapsible mode, the legend contains a native button with `aria-expanded` and `aria-controls`.
- Expanded content is exposed as a named region.
- `Enter` and `Space` toggle the content through native button behavior.
