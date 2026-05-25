# Features

Sliding panel for secondary workflows and contextual actions.

## Import

Import statement for this component.

```ts
import { VfDrawer } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDrawer
    v-model:open="open"
    title="Filters"
    size="sm"
    :disable-teleport="true"
    :scroll-lock-target="false"
  >
    <p style="margin:0 0 var(--vf-surface-padding-compact)">Update search filters for the list.</p>
    <template #footer="{ close }">
      <div style="display:flex;justify-content:flex-end;gap:var(--vf-surface-gap-compact)">
        <VfButton variant="ghost" @click="close">Close</VfButton>
      </div>
    </template>
  </VfDrawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import { VfButton, VfDrawer } from '@codemonster-ru/vueforge-core';

const open = ref(true);

const unlockPageScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

watch(
  open,
  (value) => {
    if (!value) return;
    requestAnimationFrame(unlockPageScroll);
  },
  { immediate: true }
);
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Drawer surface is rendered as `role="dialog"` with `aria-modal="true"`.
- Accessible name is provided via `aria-labelledby` from drawer title/header.
- Include a meaningful title to announce drawer purpose when it opens.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to next focusable element inside drawer (focus is trapped while open). |
| `Shift + Tab` | Moves focus to previous focusable element inside drawer. |
| `Escape` | Closes drawer when `closeOnEscape` is enabled. |
| `Enter` | Activates focused action (for example, close/apply buttons). |
