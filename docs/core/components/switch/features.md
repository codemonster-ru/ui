# Features

Boolean switch with label and custom thumb slot support.

## Import

Import statement for this component.

```ts
import { VfField, VfSwitch } from '@codemonster-ru/vueforge-core';
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

## Error

Recommended pattern when the switch needs helper text or an error message.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField
    description="Enable release notifications for deployment failures."
    :error="error"
  >
    <template #default="{ controlId, describedBy, invalid }">
      <VfSwitch
        :id="controlId"
        v-model="enabled"
        :invalid="invalid"
        :aria-describedby="describedBy"
      >
        Notifications
      </VfSwitch>
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfSwitch } from '@codemonster-ru/vueforge-core';

const enabled = ref(false);
const error = 'Enable notifications or explicitly disable alerts in settings.';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Exposes binary on/off state and should be labeled as a setting toggle.
- Use `VfField` as the default way to attach helper text or error text.
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
