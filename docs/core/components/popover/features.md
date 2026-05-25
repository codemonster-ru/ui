# Features

Floating popover container with controlled/uncontrolled open state.

## Import

Import statement for this component.

```ts
import { VfPopover } from '@codemonster-ru/vueforge-core';
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
  <div ref="stage" style="position:relative;padding:var(--vf-surface-gap);transform:translateZ(0)">
    <VfPopover placement="bottom-start" :teleport-to="stage">
      <template #trigger="{ open }">
        <VfButton class="demo-trigger" variant="ghost">{{ open ? 'Hide' : 'Show' }} details</VfButton>
      </template>

      <div style="min-width:var(--vf-breakpoint-xs);padding:var(--vf-surface-gap-tight)">
        <h4 style="margin:0 0 var(--vf-surface-gap-compact)">Popover title</h4>
        <p style="margin:0;color:var(--vf-color-muted)">Short contextual help or quick actions.</p>
      </div>
    </VfPopover>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfButton, VfPopover } from '@codemonster-ru/vueforge-core';

const stage = ref(null);
</script>

<style>
.demo-trigger {
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  padding: var(--vf-surface-gap-compact) var(--vf-surface-padding-compact);
  background: var(--vf-color-surface);
  cursor: pointer;
}
</style>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Trigger exposes `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` to announce popover state.
- Popover content is rendered as `role="dialog"` and linked back to trigger via `aria-labelledby`.
- Provide explicit trigger text so assistive technologies announce the purpose of opening the popover.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Enter` | Toggles popover when trigger is focused. |
| `Space` | Toggles popover when trigger is focused. |
| `ArrowDown` | Opens popover from trigger. |
| `Escape` | Closes popover and restores focus to trigger (when `closeOnEscape` is enabled). |
| `Tab` | Moves focus through interactive content inside popover using normal tab order. |
