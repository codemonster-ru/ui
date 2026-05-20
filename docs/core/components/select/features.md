# Features

Select control for predefined options.

## Summary

Select control for predefined options.

## Import

```ts
import { VfSelect } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSelect
    v-model="value"
    :options="options"
    placeholder="Select size"
    clearable
  />
</template>

<script setup>
import { ref } from 'vue';
import { VfSelect } from '@codemonster-ru/vueforge-core';

const value = ref('medium');
const options = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
</script>
```
````

## Accessibility

### Screen Reader

- Trigger is announced as a listbox control via `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`.
- Options are rendered with `role="option"` and selected state via `aria-selected`.
- Use a clear placeholder or associated label so the field purpose is announced correctly.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Enter` | Opens menu from trigger; inside list selects focused option. |
| `Space` | Opens menu from trigger; inside list selects focused option. |
| `ArrowDown` | Opens menu from trigger; inside list moves focus to next option. |
| `ArrowUp` | Opens menu from trigger; inside list moves focus to previous option. |
| `Home` | Inside list moves focus to first option. |
| `End` | Inside list moves focus to last option. |
| `Escape` | Closes menu and restores focus to trigger. |

