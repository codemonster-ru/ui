# Features

Context tooltip for hints and short helper text.

## Import

Import statement for this component.

```ts
import { VfTooltip } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div ref="stage" style="position:relative;padding:var(--vf-surface-gap);transform:translateZ(0)">
    <VfTooltip content="Copy to clipboard" :teleport-to="stage">
      <VfButton variant="ghost">Hover me</VfButton>
    </VfTooltip>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VfButton, VfTooltip } from '@codemonster-ru/vueforge-core';

const stage = ref(null);
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Tooltip content uses `role="tooltip"`.
- While open, trigger is linked to tooltip via `aria-describedby`, so helper text is announced in context.
- Tooltip should contain short supportive text; avoid putting critical, interactive-only information inside it.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Focus on trigger opens tooltip; moving focus away closes it. |
| `Shift + Tab` | Reverse focus navigation follows the same open/close behavior. |
| `Escape` | No explicit tooltip-specific Escape handler is implemented; tooltip closes on blur/hover out. |
