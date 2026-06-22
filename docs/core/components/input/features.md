# Features

Single-line form input with VueForge theming.

## Import

Import statement for this component.

```ts
import { VfField, VfInput } from '@codemonster-ru/vueforge-core';
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

## Error

Recommended pattern for error and helper text rendering.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField
    label="Email"
    description="We use this address for account notifications."
    :error="error"
  >
    <template #default="{ controlId, describedBy, invalid }">
      <VfInput
        :id="controlId"
        v-model="value"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="team@example.com"
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfInput } from '@codemonster-ru/vueforge-core';

const value = ref('');
const error = 'Email is required.';
</script>
```
````

## Floating Label

Use `VfField` when you want the label to float inside the control.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField label="Email" label-placement="floating">
    <template #default="{ controlId, describedBy, invalid }">
      <VfInput
        :id="controlId"
        v-model="value"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="team@example.com"
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfInput } from '@codemonster-ru/vueforge-core';

const value = ref('');
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native text input semantics for role/value announcement.
- Use `VfField` as the default way to associate visible label, helper text, and error text.
- When used without `VfField`, provide `aria-label` / `aria-labelledby` and connect descriptive text with `aria-describedby`.
- Invalid state should be exposed with `aria-invalid`.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to input field. |
| `Shift + Tab` | Moves focus away to previous focusable element. |
| `Enter` | Triggers form submit in form contexts. |
| `ArrowLeft` / `ArrowRight` | Moves caret in text. |
