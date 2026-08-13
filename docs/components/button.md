# Button

`Button` renders one immediate action as a native button or one explicit navigation action as an
anchor. Vue and Annabel Razor adapters produce the same significant DOM and consume the shared
`cm-button` CSS contract.

## CSS

Vue applications load the npm token and component styles:

```ts
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
```

PHP-only applications publish the Composer assets, then serve both entry files in this order:

```html
<link rel="stylesheet" href="/vendor/codemonster-ui/css/tokens/tokens.css" />
<link rel="stylesheet" href="/vendor/codemonster-ui/css/css/styles.css" />
```

Keep the imported files beside each entry. `AssetPublisher` publishes the complete integrity-checked
graph.

## Props

| Prop       | Values                                    | Default   | Behavior                                      |
| ---------- | ----------------------------------------- | --------- | --------------------------------------------- |
| `variant`  | `primary`, `secondary`, `danger`, `ghost` | `primary` | Visual action emphasis.                       |
| `size`     | `sm`, `md`, `lg`                          | `md`      | Shared control height and spacing.            |
| `type`     | `button`, `submit`, `reset`               | `button`  | Native button type; ignored in link mode.     |
| `href`     | non-empty string or `null`                | `null`    | A non-empty value selects native anchor mode. |
| `disabled` | boolean                                   | `false`   | Prevents button or link activation.           |
| `loading`  | boolean                                   | `false`   | Shows busy state and prevents activation.     |

Unknown safe attributes reach the semantic root. Consumer classes are appended after the stable
contract classes and deduplicated. Component-owned `type`, `href`, disabled, busy, and link ARIA
state cannot be overridden through the attribute bag.

## Slots

The required default slot supplies the visible label and accessible name. Optional `leading` and
`trailing` slots render inside fixed icon regions. Loading suppresses `leading`, shows an
`aria-hidden` spinner in its place, and keeps the label unchanged. Consumers must apply
`aria-hidden="true"` to decorative authored icons.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton } from '@codemonster-ru/ui-vue';

const saving = ref(false);
</script>

<template>
  <CmButton type="submit" variant="primary" :loading="saving" data-testid="save">
    <template #leading><SaveIcon aria-hidden="true" /></template>
    Save
  </CmButton>

  <CmButton href="/docs" variant="ghost">Documentation</CmButton>
</template>
```

Vue forwards native listeners to enabled roots. Disabled native buttons rely on browser behavior;
disabled links omit `href`, expose `role="link"` and `aria-disabled="true"`, and suppress the
consumer click handler.

## Annabel Razor

Register the provider once during bootstrap:

```php
$components = new ComponentRegistry();
$components->register(new UiComponentProvider());
```

Use static, expression, and boolean props plus named slots:

```razor
<cm-button type="submit" variant="primary" :loading="$saving" data-testid="save">
    <razor-slot name="leading"><span aria-hidden="true">↓</span></razor-slot>
    Save
</cm-button>

<cm-button href="/docs" variant="ghost">Documentation</cm-button>
```

Razor expressions and ordinary slot interpolation remain escaped. Named slots are trusted rendered
template output; do not convert untrusted props or strings to `RenderedHtml`. `href` is HTML-escaped,
but applications remain responsible for deciding which URL schemes and destinations are allowed.

## Forms and accessibility

- The default `type="button"` avoids accidental form submission; use `submit` explicitly.
- `name`, `value`, `form`, and other valid native attributes are forwarded in button mode.
- Loading uses native `disabled` plus `aria-busy="true"` and does not create a live region.
- Disabled links have no navigable `href` and are removed from normal link keyboard activation.
- Provide a non-empty visible label or a valid native accessible naming attribute.
- Focus indication and forced-color behavior come from the shared stylesheets.
