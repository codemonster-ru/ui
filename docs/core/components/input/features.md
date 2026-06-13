# Features

Single-line form input with VueForge theming.

## Import

Import statement for this component.

```ts
import { VfInput } from '@codemonster-ru/vueforge-core';
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
  <VfInput
    v-model="value"
    :leading-icon="icons.envelope"
    placeholder="Your email"
    clearable
  />
  <VfInput
    v-model="password"
    type="password"
    placeholder="Password"
    password-reveal
  />
</template>

<script setup>
import { ref } from 'vue';
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfInput } from '@codemonster-ru/vueforge-core';

const value = ref('');
const password = ref('');
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native text input semantics for role/value announcement.
- Associate an external label (or `aria-label` / `aria-labelledby`) so field purpose is announced.
- Error/help text should be connected with `aria-describedby`; invalid state with `aria-invalid`.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to input field. |
| `Shift + Tab` | Moves focus away to previous focusable element. |
| `Enter` | Triggers form submit in form contexts. |
| `ArrowLeft` / `ArrowRight` | Moves caret in text. |
