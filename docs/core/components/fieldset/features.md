# Features

Reusable grouped field wrapper for `fieldset` / `legend`, helper text, and errors.

## Import

Import statement for this component.

```ts
import { VfCheckbox, VfFieldset, VfRadio } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 340
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:var(--vf-surface-gap)">
    <VfFieldset label="Plan" description="Choose one rollout option." :error="planError">
      <template #default="{ invalid }">
        <div style="display:grid;gap:var(--vf-surface-gap-compact)">
          <VfRadio v-model="plan" name="plan" value="starter" :invalid="invalid">Starter</VfRadio>
          <VfRadio v-model="plan" name="plan" value="pro" :invalid="invalid">Pro</VfRadio>
          <VfRadio v-model="plan" name="plan" value="enterprise" :invalid="invalid">Enterprise</VfRadio>
        </div>
      </template>
    </VfFieldset>

    <VfFieldset label="Channels" description="Select every channel that should receive alerts.">
      <div style="display:grid;gap:var(--vf-surface-gap-compact)">
        <VfCheckbox v-model="email">Email</VfCheckbox>
        <VfCheckbox v-model="slack">Slack</VfCheckbox>
      </div>
    </VfFieldset>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfCheckbox, VfFieldset, VfRadio } from '@codemonster-ru/vueforge-core';

const plan = ref('');
const email = ref(true);
const slack = ref(false);
const planError = 'Select one plan to continue.';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native `fieldset` / `legend` semantics for grouped controls.
- Composes helper text and error ids into one `aria-describedby` value on the root fieldset.
- Treats `error` as invalid state automatically and also supports explicit `invalid`.

### Keyboard Support

Keyboard interaction is owned by the grouped controls rendered inside the default slot.
