# Features

Boolean input control with label support.

## Import

Import statement for this component.

```ts
import { VfCheckbox, VfField, VfFieldset } from '@codemonster-ru/vueforge-core';
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
  <VfCheckbox v-model="agreed" label="I agree to terms" />
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox } from '@codemonster-ru/vueforge-core';

const agreed = ref(true);
</script>
```
````

## Error

Recommended pattern for helper text and error rendering.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField :error="error">
    <template #default="{ controlId, describedBy, invalid }">
      <VfCheckbox
        :id="controlId"
        v-model="agreed"
        :invalid="invalid"
        :aria-describedby="describedBy"
      >
        I agree to terms
      </VfCheckbox>
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox, VfField } from '@codemonster-ru/vueforge-core';

const agreed = ref(false);
const error = 'Please accept the terms to continue.';
</script>
```
````

## Group Error

Recommended pattern when a checkbox group needs shared helper text or an error message.

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfFieldset
    label="Notification channels"
    description="Choose every channel that should receive release alerts."
    :error="error"
  >
    <template #default="{ invalid }">
      <div style="display:grid;gap:var(--vf-surface-gap-compact)">
        <VfCheckbox v-model="email" :invalid="invalid">Email</VfCheckbox>
        <VfCheckbox v-model="slack" :invalid="invalid">Slack</VfCheckbox>
        <VfCheckbox v-model="sms" :invalid="invalid">SMS</VfCheckbox>
      </div>
    </template>
  </VfFieldset>
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox, VfFieldset } from '@codemonster-ru/vueforge-core';

const email = ref(true);
const slack = ref(false);
const sms = ref(false);
const error = 'Select at least one channel to continue.';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native checkbox semantics and checked/unchecked state announcement.
- Ensure the control has an accessible name via visible label or `aria-label` / `aria-labelledby`.
- Disabled and invalid states should be exposed with native attributes and ARIA where needed.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to checkbox. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Space` | Toggles checked state. |
