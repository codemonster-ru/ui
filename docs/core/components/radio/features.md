# Features

Single radio option for grouped single-choice selection.

## Import

Import statement for this component.

```ts
import { VfRadio } from '@codemonster-ru/vueforge-core';
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

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native radio input semantics; selected state and group membership are announced.
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

