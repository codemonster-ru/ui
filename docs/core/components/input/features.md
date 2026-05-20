# Features

Single-line form input with VueForge theming.

## Summary

Single-line form input with VueForge theming.

## Import

```ts
import { VfInput } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfInput
    v-model="value"
    :leading-icon="icons.envelope"
    placeholder="Your email"
    clearable
  />
</template>

<script setup>
import { ref } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfInput } from '@codemonster-ru/vueforge-core';

const value = ref('');
</script>
```
````

## Accessibility

### Screen Reader

- Uses native text input semantics for role/value announcement.
- Associate an external label (or `aria-label` / `aria-labelledby`) so field purpose is announced.
- Error/help text should be connected with `aria-describedby`; invalid state with `aria-invalid`.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to input field. |
| `Shift + Tab` | Moves focus away to previous focusable element. |
| `Enter` | Triggers form submit in form contexts. |
| `ArrowLeft` / `ArrowRight` | Moves caret in text. |

