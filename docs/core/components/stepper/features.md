# Features

Stepper component for multi-step flows with controlled/uncontrolled active value.

## Import

Import statement for this component.

```ts
import { VfStepper } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic horizontal usage example.

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfStepper v-model="active" :items="items" />
</template>

<script setup>
import { ref } from 'vue';
import { VfStepper } from '@codemonster-ru/vueforge-core';

const active = ref('details');
const items = [
  { value: 'account', label: 'Account', description: 'Create workspace owner' },
  { value: 'details', label: 'Details', description: 'Add product information' },
  { value: 'launch', label: 'Launch', description: 'Review and publish' },
];
</script>
```
````

## Content Position

Content can be rendered on different sides of the marker depending on orientation.

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <div class="demo">
    <VfStepper
      v-model="horizontal"
      :items="horizontalItems"
      content-position="above"
      aria-label="Horizontal onboarding"
    />

    <VfStepper
      v-model="vertical"
      :items="verticalItems"
      orientation="vertical"
      content-position="start"
      aria-label="Vertical onboarding"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfStepper } from '@codemonster-ru/vueforge-core';

const horizontal = ref('plan');
const vertical = ref('profile');

const horizontalItems = [
  { value: 'start', label: 'Start', description: 'Create account' },
  { value: 'details', label: 'Details', description: 'Add product info' },
  { value: 'plan', label: 'Plan', description: 'Choose rollout' },
  { value: 'launch', label: 'Launch', description: 'Review and publish' },
];

const verticalItems = [
  { value: 'account', label: 'Account', description: 'Create workspace owner' },
  { value: 'profile', label: 'Profile', description: 'Add product and brand details' },
  { value: 'billing', label: 'Billing', description: 'Choose plan and payment method' },
];
</script>

<style>
.demo {
  display: grid;
  gap: 2rem;
}
</style>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Stepper is wrapped in a navigation landmark with an explicit label via `aria-label`.
- Current step is announced with `aria-current="step"`.
- Use concise `label` and `description` values because they become the spoken navigation model.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `ArrowRight` / `ArrowDown` | Moves to next enabled step and activates it. |
| `ArrowLeft` / `ArrowUp` | Moves to previous enabled step and activates it. |
| `Home` | Moves to first enabled step and activates it. |
| `End` | Moves to last enabled step and activates it. |
| `Tab` | Leaves the stepper and moves to the next focusable element. |
