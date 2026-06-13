# Features

Centered authentication page layout with slots for brand, title, description, form content, and footer links.

## Import

Import statement for this component.

```ts
import { VfAuthLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAuthLayout
    title="Sign in"
    description="Use your account to continue."
    :fill-viewport="false"
  >
    <div style="display:grid;gap:var(--vf-surface-gap-compact)">
      <VfInput placeholder="Email" type="email" />
      <VfInput placeholder="Password" type="password" />
      <VfButton>Sign in</VfButton>
    </div>

    <template #footer>
      <VfButton variant="ghost">Create account</VfButton>
    </template>
  </VfAuthLayout>
</template>

<script setup>
import { VfButton, VfInput } from '@codemonster-ru/vueforge-core';
import { VfAuthLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Render a clear page title for the current authentication task.
- Keep form labels, validation messages, and recovery links in the default slot content.
- Use footer links for secondary navigation such as sign up or password recovery.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered form controls and links.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through form controls and links. |
| `Shift + Tab` | Moves focus backward through form controls and links. |
| `Enter` | Submits a focused form submit button or activates a focused link. |
| `Space` | Activates focused buttons. |
