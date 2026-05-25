# Features

Navigation link component for anchor and router-link modes.

## Import

Import statement for this component.

```ts
import { VfLink } from '@codemonster-ru/vueforge-core';
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
  <div style="display:flex;gap:var(--vf-surface-padding-compact);align-items:center;flex-wrap:wrap">
    <VfLink href="https://github.com/codemonster-ru/vueforge-core" target="_blank">
      VueForge Core
    </VfLink>
    <VfLink href="/vueforge-core/components/link?tab=api" underline="always" tone="muted">
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

Additional implementation notes and caveats:

- If `to` is set, component switches to router-link mode.
- When `target=\"_blank\"` and `rel` is omitted, safe rel is applied automatically.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Renders as semantic links/buttons depending on usage; ensure link text describes destination/action.
- For current-page links, use `aria-current` where appropriate.
- For external links opening new tabs, include visible or assistive cue in label/content.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to next link. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Activates focused link. |
