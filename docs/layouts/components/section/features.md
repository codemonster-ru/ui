# Features

Section container with optional surface styling.

## Import

Import statement for this component.

```ts
import { VfSection } from '@codemonster-ru/vueforge-layouts';
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
  <VfSection surface style="padding:var(--vf-surface-padding-compact)">
    <h3 style="margin:0 0 var(--vf-surface-gap-tight)">Section title</h3>
    <p style="margin:0">Grouped content area with spacing and background surface.</p>
  </VfSection>
</template>

<script setup>
import { VfSection } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Section should include or be associated with a heading for clear region context.
- Use sectioning to break long content into navigable chunks without disrupting hierarchy.
- Maintain logical heading levels across adjacent sections.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Section wrapper is not focusable by default; focus moves through interactive descendants. |

