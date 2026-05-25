# Features

Visual separator with horizontal and vertical orientations.

## Import

Import statement for this component.

```ts
import { VfDivider } from '@codemonster-ru/vueforge-core';
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
  <div style="display:flex;align-items:center;gap:var(--vf-surface-padding-compact)">
    <span>Start</span>
    <VfDivider orientation="vertical" style="height:20px" />
    <span>End</span>
  </div>
</template>

<script setup>
import { VfDivider } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Divider is decorative/structural and should not interrupt reading flow with unnecessary verbosity.
- For semantic section separators, rely on heading structure in addition to visual separators.
- Use orientation consistently so visual and structural grouping stay aligned.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Divider is not focusable by default. |

