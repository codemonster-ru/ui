# Features

Standalone code block component with optional header, line numbers, copy action, and theme-aware rendering.

## Summary

Standalone code block component with optional header, line numbers, copy action, and theme-aware rendering.

## Import

```ts
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';
```

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCodeBlock
    language="ts"
    filename="math.ts"
    :code="code"
    show-line-numbers
    copyable
  />
</template>

<script setup>
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';

const code = `export const sum = (a: number, b: number) => a + b;`;
</script>
```
````

## Notes

- When `theme="inherit"`, component tracks nearest `data-theme` / `data-vf-theme`.
- Highlighting is async; plain-code fallback is rendered first for responsiveness.

## Accessibility

### Screen Reader

- Code block should expose readable code text and language/context metadata when available.
- Copy and action controls must have explicit accessible names (for example, “Copy code”).
- Keep decorative visuals (line highlights, icons) hidden from assistive tech unless they convey unique meaning.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to interactive controls (copy button, toggles) when present. |
| `Shift + Tab` | Moves focus backward through interactive controls. |
| `Enter` | Activates focused action control. |
| `Space` | Activates focused action control. |

