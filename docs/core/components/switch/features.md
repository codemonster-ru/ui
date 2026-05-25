# Features

Boolean switch with label and custom thumb slot support.

## Import

Import statement for this component.

```ts
import { VfSwitch } from '@codemonster-ru/vueforge-core';
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
  <VfSwitch v-model="enabled" label="Notifications" />
</template>

<script setup>
import { ref } from 'vue';
import { VfSwitch } from '@codemonster-ru/vueforge-core';

const enabled = ref(true);
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Exposes binary on/off state and should be labeled as a setting toggle.
- Provide explicit accessible name via visible label or `aria-label` / `aria-labelledby`.
- Reflect disabled/unavailable state with native and ARIA state attributes.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to switch. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Space` | Toggles switch state. |
| `Enter` | Toggles switch state where button semantics are used. |

