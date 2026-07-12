# Features

Breadcrumb trail for hierarchical navigation.

## Import

Import statement for this component.

```ts
import { VfBreadcrumbs } from '@codemonster-ru/vueforge-core';
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

## Custom separator

Use the `separator` slot to replace the default chevron. The slot receives the preceding `item` and its `index`.

```vue
<VfBreadcrumbs :items="items">
  <template #separator>
    <span>›</span>
  </template>
</VfBreadcrumbs>
```

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Breadcrumbs should be wrapped in navigation landmark with an explicit label (for example, “Breadcrumb”).
- Current page item should be marked with `aria-current="page"`.
- Keep breadcrumb labels concise and hierarchical.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus across breadcrumb links in order. |
| `Shift + Tab` | Moves focus backward across breadcrumb links. |
| `Enter` | Activates focused breadcrumb link. |
