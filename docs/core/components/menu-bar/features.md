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

| Key | Function |
| --- | --- |
| `Enter` | Opens focused branch submenu; on leaf activates selected item. |
| `Space` | Opens focused branch submenu. |
| `ArrowDown` | Opens focused branch submenu. |
| `ArrowRight` | In nested submenu, opens child branch submenu. |
| `ArrowLeft` | In nested submenu, closes current branch and returns to parent level. |
| `Escape` | Closes open submenu tree. |
| `Tab` | Moves focus out of menubar using normal document tab order. |

