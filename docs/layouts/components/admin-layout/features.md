# Features

`VfAdminLayout` provides the styled frame for an administrative interface. It fills the viewport with a fixed full-height aside and a fixed header in the right column. Main content begins below the header, while the footer is pushed to the bottom when content is short.

The component does not include a logo, navigation items, buttons, or page content. Supply those through slots to keep the layout reusable across applications.

## Built-in structure

- The `brand` slot occupies the top of the aside and matches the header height.
- When both `brand` and `aside` are present, a divider separates the brand from navigation.
- The aside has a border on its right edge; the header and footer have horizontal borders.
- The `aside` and `header` remain fixed while the page content scrolls.
- The content area uses the setup-layout background token, so setup and admin screens share the same base surface.

## Import

```ts
import { VfAdminLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAdminLayout>
    <template #brand>Acme CMS</template>
    <template #header>Administration</template>
    <template #aside>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/posts">Posts</a>
      </nav>
    </template>

    <h1>Dashboard</h1>
    <p>Overview of your workspace.</p>

    <template #footer>© 2026 Acme CMS</template>
  </VfAdminLayout>
</template>

<script setup>
import { VfAdminLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
