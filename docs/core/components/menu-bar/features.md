# Features

Horizontal menu bar with nested items and keyboard navigation.

## Import

Import statement for this component.

```ts
import { VfMenuBar } from '@codemonster-ru/vueforge-core';
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
  <VfMenuBar :items="items" />
</template>

<script setup>
import { VfMenuBar } from '@codemonster-ru/vueforge-core';

const items = [
  { value: 'home', label: 'Home' },
  {
    value: 'products',
    label: 'Products',
    children: [
      { value: 'ui-kit', label: 'UI Kit' },
      { value: 'icons', label: 'Icons' },
    ],
  },
  { value: 'docs', label: 'Docs' },
];
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Root navigation is exposed as `<nav>` with configurable `aria-label`.
- Top-level list uses `role="menubar"`; items and submenu entries use `role="menuitem"`.
- Branch items expose `aria-haspopup="menu"` and `aria-expanded` so submenu state is announced.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key            | Function                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| `Enter`        | Opens focused branch submenu; on leaf activates selected item.                    |
| `Space`        | Opens focused branch submenu.                                                     |
| `ArrowDown`    | Opens a top-level submenu or moves to the next item in an open submenu.           |
| `ArrowUp`      | Opens a top-level submenu at its last item or moves to the previous submenu item. |
| `ArrowRight`   | Moves between top-level items or opens a nested child submenu.                    |
| `ArrowLeft`    | Moves between top-level items or closes a nested submenu and focuses its parent.  |
| `Home` / `End` | Moves focus to the first or last item at the current menu level.                  |
| `Escape`       | Closes the submenu tree and restores focus to its top-level trigger.              |
| `Tab`          | Moves focus out of menubar using normal document tab order.                       |
