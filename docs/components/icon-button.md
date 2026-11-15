# IconButton

`IconButton` renders a square native button for a compact action. Use it only when the visible
content is one icon; use `Button` when an action has a visible text label.

Load the token and component stylesheets described in the [Button guide](./button.md). A native
IconButton needs no client runtime or icon registry.

## Props and content

| Prop       | Values                                    | Default  | Behavior                            |
| ---------- | ----------------------------------------- | -------- | ----------------------------------- |
| `label`    | non-empty string                          | required | Component-owned accessible name.    |
| `variant`  | Button variants                           | `ghost`  | Visual action emphasis.             |
| `size`     | `sm`, `md`, `lg`                          | `md`     | Square control and icon dimensions. |
| `type`     | `button`, `submit`, `reset`               | `button` | Native button type.                 |
| `disabled` | boolean                                   | `false`  | Native disabled state.              |

The required default slot supplies trusted icon markup. The component wraps it in
`cm-icon-button__icon` with `aria-hidden="true"`; the icon never replaces the required `label`.
Unknown safe attributes and native listeners reach the root, while `type`, `disabled`, and
`aria-label` remain component-owned.

The [Button variants](./button.md) apply to the icon button as well, including `success`, `info`,
`warn`, `help`, and `contrast`.

## Vue

```vue
<script setup lang="ts">
import { CmIconButton } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmIconButton label="Refresh release status" variant="ghost">↻</CmIconButton>
</template>
```

For the historical named-icon API, import `VfIconButton` from `@codemonster-ru/ui-vue/historical`.
It accepts an `icon` name plus the historical size, variant, and type. Provide `aria-label` or
`aria-labelledby` with an action-specific name. Otherwise the component uses an authored
`title`, or “Action” when none is supplied. Importing the normal `CmIconButton` continues to work
with just the icon assets you supply through its slot.

## Vanilla HTML

Use the canonical HTML for [icon-button](../../contracts/icon-button/contract.md).
The [warning case](../../contracts/icon-button/cases/warn.html) shows the shared status styling.
