# Features

## Summary

Multiline text input with size and validation states.

## Import

```ts
import { VfTextarea } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTextarea
    v-model="bio"
    rows="4"
    placeholder="Tell us about your project..."
  />
</template>

<script setup>
import { ref } from 'vue';
import { VfTextarea } from '@codemonster-ru/vueforge-core';

const bio = ref('');
</script>
```
````

## Accessibility

### Screen Reader

- Uses native `<textarea>` semantics, including multiline editing announcement.
- Provide associated label or `aria-label` / `aria-labelledby` to announce field purpose.
- Connect helper/error text via `aria-describedby`; expose invalid state with `aria-invalid`.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to textarea. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Arrow keys` | Move caret through multiline content. |
| `Enter` | Inserts a new line. |

