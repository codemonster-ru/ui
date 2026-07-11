# Features

Primary action component for forms, dialogs, and toolbar actions.

## Import

Import statement for this component.

```ts
import { VfButton } from '@codemonster-ru/vueforge-core';
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
  <div style="display:flex;gap:var(--vf-surface-gap);align-items:center">
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

Available visual variants.

Use `variant` to switch semantic style.
`primary | secondary | success | info | warn | help | danger | contrast | ghost`.

## Sizes

Supported size options.

Use `size` to match control rhythm.
`sm | md | lg`.

The rendered control heights are `28px`, `36px`, and `40px`; default text and icon sizes follow `14px`, `16px`, and `18px` respectively.

## Slots

Supported slots and their usage:

- `default`: button content.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native `<button>` semantics, so role and activation behavior are announced automatically.
- Provide clear visible text for the default slot or set `aria-label` when button content is icon-only.
- Reflect disabled state with native `disabled` attribute when interaction is not available.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to the button. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Enter` | Activates button action. |
| `Space` | Activates button action. |
