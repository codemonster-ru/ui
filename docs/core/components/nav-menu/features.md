# Features

Hierarchical navigation menu with single or multiple expanded branches.

## Import

Import statement for this component.

```ts
import { VfNavMenu } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="max-width:340px">
    <VfNavMenu
      v-model="active"
      :items="items"
      expand-mode="single"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfNavMenu } from '@codemonster-ru/vueforge-core';

const active = ref('guides-installation');

const items = [
  {
    value: 'getting-started',
    label: 'Getting Started',
    children: [
      { value: 'guides-installation', label: 'Installation' },
      { value: 'guides-configuration', label: 'Configuration' },
    ],
  },
  {
    value: 'components',
    label: 'Components',
    children: [
      { value: 'button', label: 'Button' },
      { value: 'dropdown', label: 'Dropdown' },
      { value: 'popover', label: 'Popover' },
    ],
  },
];
</script>
```
````

## Sidebar

Use the `sidebar` variant for application navigation where the active top-level ancestor uses a neutral pill and the current nested page uses an active rail.

```vue
<VfNavMenu v-model="active" :items="items" variant="sidebar" />
```

The sidebar variant automatically switches to an icon-only presentation when its own width reaches
`--vf-nav-menu-sidebar-compact-breakpoint` (`8rem` by default). Top-level labels remain available
to assistive technologies, while group headings, nested lists, and trailing indicators are hidden.
Give every top-level item a `leadingIcon` when the menu can appear in a collapsed sidebar.

Because this behavior uses the menu's actual container width, temporarily expanding a collapsed
`VfAdminLayout` sidebar on hover or keyboard focus restores the complete navigation without an
additional prop. Labels remain on one line while the item width, indicators, and expanded branch
transition between compact and regular presentations.

Pass `compact` when the parent owns the sidebar transition and both components must change state in
the same render:

```vue
<VfNavMenu v-model="active" :compact="isSidebarCompact" :items="items" variant="sidebar" />
```

Omit `compact` for standalone responsive menus; width detection remains the default.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Root navigation is rendered as `<nav>` with configurable `aria-label`.
- Expandable branch controls expose `aria-expanded` so collapsed/expanded state is announced.
- Active links/items expose `aria-current="page"` for current-location context.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key           | Function                                                       |
| ------------- | -------------------------------------------------------------- |
| `Tab`         | Moves focus to next interactive item in the menu order.        |
| `Shift + Tab` | Moves focus to previous interactive item in the menu order.    |
| `Enter`       | Activates focused link/item, or toggles focused branch button. |
| `Space`       | Toggles focused branch button.                                 |
