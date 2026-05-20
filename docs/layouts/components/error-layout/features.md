# Features

## Summary

Dedicated error page layout with slots for code, title, description, and actions.

## Import

```ts
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfErrorLayout
    code="404"
    title="Page not found"
    description="The page you requested does not exist or was moved."
    :fill-viewport="false"
  >
    <template #actions>
      <div style="display:flex;gap:8px;justify-content:center">
        <button>Go Home</button>
        <button>Contact Support</button>
      </div>
    </template>
  </VfErrorLayout>
</template>

<script setup>
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Error layout should announce error context clearly (status/title/message) using readable text.
- Recovery actions (retry, back, home) must have explicit action labels.
- Keep the primary recovery action prominent in reading order.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through available recovery actions. |
| `Shift + Tab` | Moves focus backward through recovery actions. |
| `Enter` | Activates focused recovery action. |
| `Space` | Activates focused recovery action. |

