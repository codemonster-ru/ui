# Features

## Import

```ts
import { VfAvatar } from '@codemonster-ru/vueforge-core';
```

## Content

An avatar renders an image first, then a label, then an icon. Use the default slot for custom fallback content.

````playground-src
mode: component
framework: vue
height: 170
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;align-items:center">
    <VfAvatar label="AK" size="sm" shape="circle" />
    <VfAvatar icon="user" size="md" shape="circle" />
    <VfAvatar size="lg">?</VfAvatar>
  </div>
</template>

<script setup>
import { VfAvatar } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

The component is non-interactive. Add `aria-label` or an appropriate role to describe it when needed. `imageAlt` provides alternative text for an image; it defaults to an empty string when the image is decorative.
