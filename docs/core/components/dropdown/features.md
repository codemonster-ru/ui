# Features

Menu dropdown with keyboard navigation and floating positioning.

## Import

Import statement for this component.

```ts
import { VfDropdown } from '@codemonster-ru/vueforge-core';
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
  <VfDropdown :disable-teleport="true">
    <template #trigger="{ open }">
      <VfButton class="demo-trigger" variant="ghost">{{ open ? 'Close' : 'Open' }} menu</VfButton>
    </template>

    <div style="display:flex;flex-direction:column;gap:var(--vf-surface-gap-tight);min-width:var(--vf-breakpoint-xs)">
      <VfButton role="menuitem" class="demo-item" variant="ghost">Profile</VfButton>
      <VfButton role="menuitem" class="demo-item" variant="ghost">Billing</VfButton>
      <VfButton role="menuitem" class="demo-item" variant="ghost">Sign out</VfButton>
    </div>
  </VfDropdown>
</template>

<script setup>
import { VfButton, VfDropdown } from '@codemonster-ru/vueforge-core';
</script>

<style>
.demo-trigger {
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  padding: var(--vf-surface-gap-compact) var(--vf-surface-padding-compact);
  background: var(--vf-color-surface);
  cursor: pointer;
}

.demo-item {
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  padding: var(--vf-surface-gap-compact) var(--vf-surface-gap);
  background: var(--vf-color-surface);
  text-align: left;
  cursor: pointer;
}
</style>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Trigger exposes `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` so menu state is announced.
- Menu container uses `role="menu"` and should contain interactive children with `role="menuitem"`.
- Keep trigger text explicit so assistive tech can identify what menu is being opened.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Enter` | Opens the menu from trigger and moves focus to the first menu item. |
| `Space` | Opens the menu from trigger and moves focus to the first menu item. |
| `ArrowDown` | Opens menu from trigger; inside menu moves focus to next item. |
| `ArrowUp` | Inside menu moves focus to previous item. |
| `Home` | Inside menu moves focus to first item. |
| `End` | Inside menu moves focus to last item. |
| `Escape` | Closes menu and restores focus to trigger. |
