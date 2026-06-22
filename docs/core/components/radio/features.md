# Features

Single radio option for grouped single-choice selection.

## Import

Import statement for this component.

```ts
import { VfFieldset, VfRadio } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:var(--vf-surface-gap-compact)">
    <VfRadio v-model="size" name="size" value="s" label="Small" />
    <VfRadio v-model="size" name="size" value="m" label="Medium" />
    <VfRadio v-model="size" name="size" value="l" label="Large" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfRadio } from '@codemonster-ru/vueforge-core';

const size = ref('m');
</script>
```
````

## Error

Recommended pattern when the radio group needs helper text or an error message.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfFieldset label="Plan" description="Choose one rollout option." :error="error">
    <template #default="{ invalid }">
      <div style="display:grid;gap:var(--vf-surface-gap-compact)">
        <VfRadio v-model="plan" name="plan" value="starter" :invalid="invalid">Starter</VfRadio>
        <VfRadio v-model="plan" name="plan" value="pro" :invalid="invalid">Pro</VfRadio>
        <VfRadio v-model="plan" name="plan" value="enterprise" :invalid="invalid">Enterprise</VfRadio>
      </div>
    </template>
  </VfFieldset>
</template>

<script setup>
import { ref } from 'vue';
import { VfFieldset, VfRadio } from '@codemonster-ru/vueforge-core';

const plan = ref('');
const error = 'Select one plan to continue.';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native radio input semantics; selected state and group membership are announced.
- Use `VfFieldset` as the default way to render group-level helper text or error text.
- Radios should be grouped with shared labeling (for example, `fieldset/legend` or `aria-labelledby`).
- Each option must have a clear text label.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus into/out of radio group. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `ArrowRight` / `ArrowDown` | Moves selection to next radio in group (native behavior). |
| `ArrowLeft` / `ArrowUp` | Moves selection to previous radio in group (native behavior). |
| `Space` | Selects focused radio option. |
