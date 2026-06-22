# Features

Reusable form field wrapper for labels, helper text, and errors.

## Import

Import statement for this component.

```ts
import { VfCheckbox, VfField, VfInput } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:var(--vf-surface-gap)">
    <VfField
      label="Project name"
      description="This name is visible to workspace members."
      :error="nameError"
    >
      <template #default="{ controlId, describedBy, invalid }">
        <VfInput
          :id="controlId"
          v-model="name"
          :invalid="invalid"
          :aria-describedby="describedBy"
          placeholder="Acme Platform"
        />
      </template>
    </VfField>

    <VfField :error="termsError">
      <template #default="{ controlId, describedBy, invalid }">
        <VfCheckbox
          :id="controlId"
          v-model="accepted"
          :invalid="invalid"
          :aria-describedby="describedBy"
        >
          I agree to the terms
        </VfCheckbox>
      </template>
    </VfField>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox, VfField, VfInput } from '@codemonster-ru/vueforge-core';

const name = ref('');
const accepted = ref(false);
const nameError = 'Project name is required.';
const termsError = 'You must accept the terms to continue.';
</script>
```
````

## Floating Label

Floating label layout for text-like controls.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField label="Workspace name" label-placement="floating" :error="error">
    <template #default="{ controlId, describedBy, invalid }">
      <VfInput
        :id="controlId"
        v-model="name"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="Workspace name"
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfInput } from '@codemonster-ru/vueforge-core';

const name = ref('');
const error = 'Workspace name is required.';
</script>
```
````

## Floating Variants

Floating labels support three visual variants.

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:var(--vf-surface-gap)">
    <VfField label="In label" label-placement="floating" floating-variant="in">
      <template #default="{ controlId, describedBy, invalid }">
        <VfInput
          :id="controlId"
          v-model="valueIn"
          :invalid="invalid"
          :aria-describedby="describedBy"
          placeholder="In variant"
        />
      </template>
    </VfField>

    <VfField label="On label" label-placement="floating" floating-variant="on">
      <template #default="{ controlId, describedBy, invalid }">
        <VfInput
          :id="controlId"
          v-model="valueOn"
          :invalid="invalid"
          :aria-describedby="describedBy"
          placeholder="On variant"
        />
      </template>
    </VfField>

    <VfField label="Over label" label-placement="floating" floating-variant="over">
      <template #default="{ controlId, describedBy, invalid }">
        <VfInput
          :id="controlId"
          v-model="valueOver"
          :invalid="invalid"
          :aria-describedby="describedBy"
          placeholder="Over variant"
        />
      </template>
    </VfField>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfInput } from '@codemonster-ru/vueforge-core';

const valueIn = ref('');
const valueOn = ref('');
const valueOver = ref('');
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Generates a control id so the visible label can associate through `for`.
- Composes helper text and error ids into one `aria-describedby` value.
- Treats `error` as invalid state automatically and also supports explicit `invalid`.
- `labelPlacement="floating"` is intended for `VfInput`, `VfTextarea`, and `VfSelect`; selection controls continue to use the default stacked label layout.

### Keyboard Support

Keyboard interaction is owned by the wrapped control component.
