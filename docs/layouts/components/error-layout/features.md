# Features

Dedicated error page layout with slots for code, title, description, and actions.

## Import

Import statement for this component.

```ts
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

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
      <div style="display:flex;gap:var(--vf-surface-gap-compact);justify-content:center">
        <VfButton variant="ghost">Go Home</VfButton>
        <VfButton>Contact Support</VfButton>
      </div>
    </template>
  </VfErrorLayout>
</template>

<script setup>
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
import { VfButton } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Error layout should announce error context clearly (status/title/message) using readable text.
- Recovery actions (retry, back, home) must have explicit action labels.
- Keep the primary recovery action prominent in reading order.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through available recovery actions. |
| `Shift + Tab` | Moves focus backward through recovery actions. |
| `Enter` | Activates focused recovery action. |
| `Space` | Activates focused recovery action. |
