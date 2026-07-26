# Features

Vertical menu with icon support, actions, links, disabled items, and a danger tone.

## Import

```ts
import { VfDropdown, VfMenu, VfMenuItem } from '@codemonster-ru/vueforge-core';
```

## Dropdown menu

Use `VfDropdown` for popup positioning and `VfMenu` for the menu content.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDropdown :disable-teleport="true">
    <template #trigger>
      <VfButton variant="secondary">Open menu</VfButton>
    </template>

    <VfMenu>
      <VfMenuItem :icon="icons.pencil" label="Edit" @select="editItem" />
      <VfMenuItem :icon="icons.trash" label="Delete" tone="danger" @select="deleteItem" />
    </VfMenu>
  </VfDropdown>
</template>

<script setup lang="ts">
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfButton, VfDropdown, VfMenu, VfMenuItem } from '@codemonster-ru/vueforge-core';

function editItem() {}
function deleteItem() {}
</script>
```
````

Use `href` on `VfMenuItem` when an item should navigate instead of invoking an action.

## Accessibility

- `VfMenu` renders `role="menu"`.
- `VfMenuItem` renders a `button` for actions and an `a` element for links, both with
  `role="menuitem"`.
- `VfDropdown` provides Arrow, Home, End, Escape, and focus-return behavior for the popup.
