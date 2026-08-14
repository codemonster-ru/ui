# IconButton

`IconButton` renders a square native button for a compact action. Use it only when the visible
content is one icon; use `Button` when an action has a visible text label.

Load the token and component stylesheets described in the [Button guide](./button.md). IconButton
has no client runtime, icon registry, link mode, or loading state.

## Props and content

| Prop       | Values                                    | Default  | Behavior                            |
| ---------- | ----------------------------------------- | -------- | ----------------------------------- |
| `label`    | non-empty string                          | required | Component-owned accessible name.    |
| `variant`  | `primary`, `secondary`, `danger`, `ghost` | `ghost`  | Visual action emphasis.             |
| `size`     | `sm`, `md`, `lg`                          | `md`     | Square control and icon dimensions. |
| `type`     | `button`, `submit`, `reset`               | `button` | Native button type.                 |
| `disabled` | boolean                                   | `false`  | Native disabled state.              |

The required default slot supplies trusted icon markup. The component wraps it in
`cm-icon-button__icon` with `aria-hidden="true"`; the icon never replaces the required `label`.
Unknown safe attributes and native listeners reach the root, while `type`, `disabled`, and
`aria-label` remain component-owned.

## Vue

```vue
<script setup lang="ts">
import { CmIconButton } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmIconButton label="Refresh release status" variant="ghost">↻</CmIconButton>
</template>
```

## Annabel Razor

After registering `UiComponentProvider`, use the same contract with trusted template content:

```razor
<cm-icon-button label="Settings" variant="ghost">
    <svg viewBox="0 0 24 24"><!-- authored icon paths --></svg>
</cm-icon-button>
```

Fallback props and root attributes remain escaped. Do not convert user-controlled strings into
trusted `RenderedHtml` for the default slot. Native button keyboard, focus, form, and disabled
behavior is preserved by both adapters.
