# Features

## Summary

Section container with optional surface styling.

## Import

```ts
import { VfSection } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSection surface style="padding:12px">
    <h3 style="margin:0 0 6px">Section title</h3>
    <p style="margin:0">Grouped content area with spacing and background surface.</p>
  </VfSection>
</template>

<script setup>
import { VfSection } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Section should include or be associated with a heading for clear region context.
- Use sectioning to break long content into navigable chunks without disrupting hierarchy.
- Maintain logical heading levels across adjacent sections.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Section wrapper is not focusable by default; focus moves through interactive descendants. |

