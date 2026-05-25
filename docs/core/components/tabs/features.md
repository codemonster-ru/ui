# Features

Tabs component with controlled/uncontrolled active value.

## Import

Import statement for this component.

```ts
import { VfTabs } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTabs v-model="active" :items="items" />
</template>

<script setup>
import { ref } from 'vue';
import { VfTabs } from '@codemonster-ru/vueforge-core';

const active = ref('overview');
const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'api', label: 'API' },
  { value: 'examples', label: 'Examples' },
];
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Tabs use WAI-ARIA tab pattern: tab list with `role="tablist"`, tab buttons with `role="tab"`, and panel with `role="tabpanel"`.
- Active state is reflected via `aria-selected`; panel is linked to tab via `aria-labelledby`.
- Provide clear tab labels because they become the primary spoken navigation model.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `ArrowRight` / `ArrowDown` | Moves to next enabled tab and activates it. |
| `ArrowLeft` / `ArrowUp` | Moves to previous enabled tab and activates it. |
| `Home` | Moves to first enabled tab and activates it. |
| `End` | Moves to last enabled tab and activates it. |
| `Tab` | Leaves tablist and moves to next focusable element (for example, active tab panel content). |

