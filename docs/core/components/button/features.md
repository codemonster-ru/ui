# Features

## Summary

Primary action component for forms, dialogs, and toolbar actions.

## Import

```ts
import { VfButton } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:10px;align-items:center">
    <VfButton variant="solid">Save</VfButton>
    <VfButton variant="ghost">Cancel</VfButton>
  </div>
</template>

<script setup>
import { VfButton } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Variants

Use `variant` to switch semantic style:
`primary | secondary | success | info | warn | help | danger | contrast | ghost`.

## Sizes

Use `size` to match control rhythm:
`sm | md | lg`.

## Slots

- `default`: button content.

## Accessibility

### Screen Reader

- Uses native `<button>` semantics, so role and activation behavior are announced automatically.
- Provide clear visible text for the default slot or set `aria-label` when button content is icon-only.
- Reflect disabled state with native `disabled` attribute when interaction is not available.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to the button. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Activates button action. |
| `Space` | Activates button action. |

