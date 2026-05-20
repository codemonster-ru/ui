# Features

## Summary

Floating popover container with controlled/uncontrolled open state.

## Import

```ts
import { VfPopover } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPopover placement="bottom-start">
    <template #trigger="{ open }">
      <button class="demo-trigger">{{ open ? 'Hide' : 'Show' }} details</button>
    </template>

    <div style="min-width:220px;padding:6px">
      <h4 style="margin:0 0 8px">Popover title</h4>
      <p style="margin:0;color:#4b5563">Short contextual help or quick actions.</p>
    </div>
  </VfPopover>
</template>

<script setup>
import { VfPopover } from '@codemonster-ru/vueforge-core';
</script>

<style>
.demo-trigger {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: white;
  cursor: pointer;
}
</style>
```
````

## Accessibility

### Screen Reader

- Trigger exposes `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` to announce popover state.
- Popover content is rendered as `role="dialog"` and linked back to trigger via `aria-labelledby`.
- Provide explicit trigger text so assistive technologies announce the purpose of opening the popover.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Enter` | Toggles popover when trigger is focused. |
| `Space` | Toggles popover when trigger is focused. |
| `ArrowDown` | Opens popover from trigger. |
| `Escape` | Closes popover and restores focus to trigger (when `closeOnEscape` is enabled). |
| `Tab` | Moves focus through interactive content inside popover using normal tab order. |

