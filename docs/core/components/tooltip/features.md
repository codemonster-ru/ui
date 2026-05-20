# Features

Context tooltip for hints and short helper text.

## Summary

Context tooltip for hints and short helper text.

## Import

```ts
import { VfTooltip } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTooltip content="Copy to clipboard">
    <VfButton variant="ghost">Hover me</VfButton>
  </VfTooltip>
</template>

<script setup>
import { VfButton, VfTooltip } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Tooltip content uses `role="tooltip"`.
- While open, trigger is linked to tooltip via `aria-describedby`, so helper text is announced in context.
- Tooltip should contain short supportive text; avoid putting critical, interactive-only information inside it.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Focus on trigger opens tooltip; moving focus away closes it. |
| `Shift + Tab` | Reverse focus navigation follows the same open/close behavior. |
| `Escape` | No explicit tooltip-specific Escape handler is implemented; tooltip closes on blur/hover out. |

