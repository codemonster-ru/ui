# Features

## Summary

Navigation link component for anchor and router-link modes.

## Import

```ts
import { VfLink } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <VfLink href="https://github.com/primefaces/primevue" target="_blank">
      PrimeVue
    </VfLink>
    <VfLink href="#api" underline="always" tone="muted">
      API section
    </VfLink>
  </div>
</template>

<script setup>
import { VfLink } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Notes

- If `to` is set, component switches to router-link mode.
- When `target=\"_blank\"` and `rel` is omitted, safe rel is applied automatically.

## Accessibility

### Screen Reader

- Renders as semantic links/buttons depending on usage; ensure link text describes destination/action.
- For current-page links, use `aria-current` where appropriate.
- For external links opening new tabs, include visible or assistive cue in label/content.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to next link. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Activates focused link. |

