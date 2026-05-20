# Features

## Summary

Breadcrumb trail for hierarchical navigation.

## Import

```ts
import { VfBreadcrumbs } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfBreadcrumbs :items="items" />
</template>

<script setup>
import { VfBreadcrumbs } from '@codemonster-ru/vueforge-core';

const items = [
  { label: 'Docs', href: '#' },
  { label: 'Core', href: '#' },
  { label: 'VfBreadcrumbs', current: true },
];
</script>
```
````

## Accessibility

### Screen Reader

- Breadcrumbs should be wrapped in navigation landmark with an explicit label (for example, “Breadcrumb”).
- Current page item should be marked with `aria-current="page"`.
- Keep breadcrumb labels concise and hierarchical.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus across breadcrumb links in order. |
| `Shift + Tab` | Moves focus backward across breadcrumb links. |
| `Enter` | Activates focused breadcrumb link. |

