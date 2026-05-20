# Features

## Summary

Boolean input control with label support.

## Import

```ts
import { VfCheckbox } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCheckbox v-model="agreed" label="I agree to terms" />
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox } from '@codemonster-ru/vueforge-core';

const agreed = ref(true);
</script>
```
````

## Accessibility

### Screen Reader

- Uses native checkbox semantics and checked/unchecked state announcement.
- Ensure the control has an accessible name via visible label or `aria-label` / `aria-labelledby`.
- Disabled and invalid states should be exposed with native attributes and ARIA where needed.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to checkbox. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Space` | Toggles checked state. |

