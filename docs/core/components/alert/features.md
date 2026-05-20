# Features

## Summary

Feedback component for status and contextual messages.

## Import

```ts
import { VfAlert } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:10px">
    <VfAlert tone="success" title="Saved">
      Changes were saved successfully.
    </VfAlert>
    <VfAlert tone="warn" title="Attention">
      Double-check required fields before publishing.
    </VfAlert>
  </div>
</template>

<script setup>
import { VfAlert } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Alerts should communicate concise status/context and remain text-first.
- When used for important asynchronous feedback, ensure content is exposed in an appropriate live region strategy in host app.
- Keep iconography decorative unless it conveys unique meaning not present in text.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to interactive elements inside alert (if any). |
| `Shift + Tab` | Moves focus backward through interactive elements. |

