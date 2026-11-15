---
title: 'Getting started with CodeMonster UI'
description: 'Install CodeMonster UI in Vue or Vanilla applications'
order: 2
---

# Getting started with CodeMonster UI

CodeMonster UI publishes one shared token and CSS layer, a Vue adapter,
and an optional browser runtime for progressively enhanced server markup.

The examples below target the [draft 2.0 cohort](./codemonster-ui-2.0-release-notes.md) in this
checkout. For the stable Vue release, follow the [1.1 release notes](./codemonster-ui-1.1-release-notes.md).

## Install a local 2.0 build

From the repository root, with the Node version in [`.nvmrc`](../.nvmrc):

```bash
npm ci
npm run build
ui_tarballs="$(mktemp -d)"
npm pack --ignore-scripts --pack-destination "$ui_tarballs" \
  --workspace @codemonster-ru/ui-tokens --workspace @codemonster-ru/ui-css \
  --workspace @codemonster-ru/ui-runtime --workspace @codemonster-ru/ui-icons \
  --workspace @codemonster-ru/ui-vue --workspace @codemonster-ru/ui-layouts
```

In an existing Vue 3.5 application, using the same shell, install the resulting tarballs together:

```bash
npm install "$ui_tarballs"/*.tgz
```

Use Node `^22.22.3`, `^24.15.0`, or `>=26.0.0` to consume these packages in Node, including
when rendering Vue on the server. The archive list includes the optional
[page layouts](./components/layouts.md); omit `ui-layouts` when packing if you do not use them.

## Vue quick start

Load tokens before component styles in the application entry:

```ts
import { createApp } from 'vue';
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
import App from './App.vue';

createApp(App).mount('#app');
```

Components are imported directly and keep application state in ordinary Vue refs:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmField, CmInput } from '@codemonster-ru/ui-vue';

const email = ref('');
</script>

<template>
  <form method="post">
    <CmField control-id="account-email" label="Email" required>
      <template #default="{ controlId, describedBy, invalid, required }">
        <CmInput
          :id="controlId"
          v-model="email"
          name="email"
          type="email"
          :aria-describedby="describedBy"
          :invalid="invalid"
          :required="required"
        />
      </template>
    </CmField>
    <CmButton type="submit">Save account</CmButton>
  </form>
</template>
```

CodeMonster UI has no global Vue plugin. Import only the components used by each module, and do not
start the shared DOM runtime over Vue-owned component trees.

For SSR, import components from the same package and render with your framework's Vue SSR entry.
Put the CSS imports in the browser build or serve the linked stylesheets from the HTML layout;
Node does not load CSS imports on its own. Use the [theme recipe](./recipes/theme-switch.md) to
render the same initial preference on the server and client.

## Vanilla HTML, CSS, and JavaScript

Follow the [Vanilla guide](./vanilla.md) to build and serve the static assets. Render the
[canonical HTML](../contracts/README.md) directly in your application or with your template engine.
Load the shared styles and start the browser runtime for interactive components.

## Next steps

- Learn the [token and theme contract](./tokens/getting-started.md).
- Choose complete or component-level entries in the [CSS guide](./css/getting-started.md).
- Start with the [Button](./components/button.md), [forms](./components/forms.md), and
  [layout primitives](./components/layout-primitives.md).
