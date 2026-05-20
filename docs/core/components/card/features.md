# Features

## Summary

Surface container for grouped content.

## Import

```ts
import { VfCard } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCard title="Project Summary">
    <p style="margin:0 0 10px">VueForge docs migration is in progress.</p>
    <ul style="margin:0;padding-left:18px">
      <li>Components documented: 42</li>
      <li>Interactive examples: enabled</li>
    </ul>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button>Cancel</button>
        <button>Continue</button>
      </div>
    </template>
  </VfCard>
</template>

<script setup>
import { VfCard } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Card is a structural container; preserve heading hierarchy and landmark semantics in card content.
- Interactive cards should expose explicit interactive element semantics (link/button), not rely on clickable `div`.
- Provide clear section headings for scanability in assistive technology navigation.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through interactive elements inside card. |
| `Shift + Tab` | Moves focus backward through interactive elements. |
| `Enter` | Activates focused interactive element. |

