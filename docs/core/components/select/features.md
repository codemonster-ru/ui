# Features

Select control for predefined options.

## Import

Import statement for this component.

```ts
import { VfField, VfSelect } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <div ref="stage" style="position:relative;padding:var(--vf-surface-gap);transform:translateZ(0)">
    <VfSelect
      v-model="value"
      :options="options"
      placeholder="Select size"
      clearable
      :teleport-to="stage"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfSelect } from '@codemonster-ru/vueforge-core';

const stage = ref(null);
const value = ref('medium');
const options = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
</script>
```
````

## Error

Recommended pattern for error and helper text rendering.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <div ref="stage" style="position:relative;padding:var(--vf-surface-gap);transform:translateZ(0)">
    <VfField
      label="Plan"
      description="Choose the rollout tier for this workspace."
      :error="error"
    >
      <template #default="{ controlId, describedBy, invalid }">
        <VfSelect
          :id="controlId"
          v-model="value"
          :options="options"
          :invalid="invalid"
          :aria-describedby="describedBy"
          placeholder="Select plan"
          :teleport-to="stage"
        />
      </template>
    </VfField>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfSelect } from '@codemonster-ru/vueforge-core';

const stage = ref(null);
const value = ref('');
const error = 'Plan is required.';
const options = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
];
</script>
```
````

## Floating Label

Use `VfField` when you want the label to float inside the trigger.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField label="Plan" label-placement="floating">
    <template #default="{ controlId, describedBy, invalid }">
      <VfSelect
        :id="controlId"
        v-model="value"
        :options="options"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="Select plan"
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfSelect } from '@codemonster-ru/vueforge-core';

const value = ref('');
const options = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
];
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Trigger is announced as a listbox control via `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`.
- Options are rendered with `role="option"` and selected state via `aria-selected`.
- Use `VfField` as the default way to provide the visible label plus helper/error text wiring.
- When used without `VfField`, provide a clear placeholder or accessible label and connect descriptive text with `aria-describedby`.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Enter` | Opens menu from trigger; inside list selects focused option. |
| `Space` | Opens menu from trigger; inside list selects focused option. |
| `ArrowDown` | Opens menu from trigger; inside list moves focus to next option. |
| `ArrowUp` | Opens menu from trigger; inside list moves focus to previous option. |
| `Home` | Inside list moves focus to first option. |
| `End` | Inside list moves focus to last option. |
| `Escape` | Closes menu and restores focus to trigger. |
