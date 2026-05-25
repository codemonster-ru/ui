# Features

Surface container for grouped content.

## Import

Import statement for this component.

```ts
import { VfCard } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCard title="Project Summary">
    <p style="margin:0 0 var(--vf-surface-gap)">VueForge docs migration is in progress.</p>
    <ul style="margin:0;padding-left:var(--vf-surface-padding)">
      <li>Components documented: 42</li>
      <li>Interactive examples: enabled</li>
    </ul>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:var(--vf-surface-gap-compact)">
        <VfButton variant="ghost">Cancel</VfButton>
        <VfButton>Continue</VfButton>
      </div>
    </template>
  </VfCard>
</template>

<script setup>
import { VfButton, VfCard } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Card is a structural container; preserve heading hierarchy and landmark semantics in card content.
- Interactive cards should expose explicit interactive element semantics (link/button), not rely on clickable `div`.
- Provide clear section headings for scanability in assistive technology navigation.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through interactive elements inside card. |
| `Shift + Tab` | Moves focus backward through interactive elements. |
| `Enter` | Activates focused interactive element. |
