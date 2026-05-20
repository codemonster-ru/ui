# Features

## Summary

Menu dropdown with keyboard navigation and floating positioning.

## Import

```ts
import { VfDropdown } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDropdown>
    <template #trigger="{ open }">
      <button class="demo-trigger">{{ open ? 'Close' : 'Open' }} menu</button>
    </template>

    <div style="display:flex;flex-direction:column;gap:6px;min-width:180px">
      <button role="menuitem" class="demo-item">Profile</button>
      <button role="menuitem" class="demo-item">Billing</button>
      <button role="menuitem" class="demo-item">Sign out</button>
    </div>
  </VfDropdown>
</template>

<script setup>
import { VfDropdown } from '@codemonster-ru/vueforge-core';
</script>

<style>
.demo-trigger {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: white;
  cursor: pointer;
}

.demo-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  background: white;
  text-align: left;
  cursor: pointer;
}
</style>
```
````

## Accessibility

### Screen Reader

- Trigger exposes `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` so menu state is announced.
- Menu container uses `role="menu"` and should contain interactive children with `role="menuitem"`.
- Keep trigger text explicit so assistive tech can identify what menu is being opened.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Enter` | Opens the menu from trigger and moves focus to the first menu item. |
| `Space` | Opens the menu from trigger and moves focus to the first menu item. |
| `ArrowDown` | Opens menu from trigger; inside menu moves focus to next item. |
| `ArrowUp` | Inside menu moves focus to previous item. |
| `Home` | Inside menu moves focus to first item. |
| `End` | Inside menu moves focus to last item. |
| `Escape` | Closes menu and restores focus to trigger. |

