---
title: 'Getting started with CodeMonster UI'
description: 'Install CodeMonster UI in Vue or Vanilla applications'
order: 2
---

# Getting started with CodeMonster UI

CodeMonster UI publishes one shared token and CSS layer, a Vue adapter,
and an optional browser runtime for progressively enhanced server markup.

## Choose a release

The examples below target the [draft 2.0 cohort](./codemonster-ui-2.0-release-notes.md) in this
checkout. Install matching packages from the local build to try them in an application.
For a registry install of stable Vue, follow the [1.1 release notes](./codemonster-ui-1.1-release-notes.md).

## Install a local 2.0 build

From the repository root, with the Node version in [`.nvmrc`](../.nvmrc):

```bash
npm ci
npm run build
ui_tarballs="$(mktemp -d)"
npm pack --ignore-scripts --pack-destination "$ui_tarballs" \
  --workspace @codemonster-ru/ui-tokens --workspace @codemonster-ru/ui-css \
  --workspace @codemonster-ru/ui-runtime --workspace @codemonster-ru/ui-icons \
  --workspace @codemonster-ru/ui-vue --workspace @codemonster-ru/ui-layouts \
  --workspace @codemonster-ru/ui-utilities
```

In your consumer project, using the same shell, install the resulting tarballs together:

```bash
npm install "$ui_tarballs"/*.tgz
```

Use Node `^22.22.3`, `^24.15.0`, or `>=26.0.0` for Node consumers, including Vue SSR.
Vue integrations require Vue `^3.5.0`. The package group depends on the integration:

| Integration              | Workspaces to pack and install                                                 |
| ------------------------ | ------------------------------------------------------------------------------ |
| Vue                      | Tokens, CSS, Runtime, Icons, and Vue. Add Layouts for page layouts and shells. |
| Vanilla with controllers | Tokens, CSS, and Runtime. Add Icons if you import icon geometry.               |
| CSS only                 | Tokens and CSS.                                                                |

Add Utilities when using its utility stylesheet. For an app with no package manager or JS
bundler, follow the [standalone browser assets guide](./vanilla.md#browser-assets).

## Vue quick start

Use this entry as `main.ts` in an existing Vue app with an HTML element such as
`<div id="app"></div>`. Load tokens before component styles. The optional fonts entry supplies
the Inter font used by the showcase.

```ts file=/main.ts
import { createApp } from 'vue';
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
import App from './App.vue';

createApp(App).mount('#app');
```

Create `App.vue` next to this entry. Components keep application state in ordinary Vue refs.

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

Import the components used by each module. Types are exported alongside components, for example
`CmInputProps`, and Vue can also infer them directly in the template. For JavaScript, use
`main.js` and remove `lang="ts"` from the Vue example.

For server rendering, use the same component imports and your framework's Vue SSR entry.
Deliver the stylesheets through the browser build or the document layout. See the
[SSR and hydration guide](./integration.md#server-rendering-and-hydration).

Continue with a [DataTable](./components/data-tables.md#datatable-data-model), a
[navigation menu](./components/navigation.md#nested-navigation), or a
[dialog](./components/overlays.md#vue). The [theme recipe](./recipes/theme-switch.md#server-rendering)
shows how to reuse the same preference in server rendering and hydration.

## Vanilla HTML, CSS, and JavaScript

Follow the [Vanilla quick start](./vanilla.md#quick-start) for copyable markup and JavaScript.
Use the [component reference](./components/index.md) to find the canonical HTML for the other
components. Static components and native form controls work with CSS alone.

## Next steps

- Learn the [token and theme contract](./tokens/getting-started.md).
- Choose and persist a theme in [Vue or Vanilla](./recipes/theme-switch.md).
- Choose complete or component-level entries in the [CSS guide](./css/getting-started.md).
- Start with the [Button](./components/button.md), [forms](./components/forms.md), and
  [layout primitives](./components/layout-primitives.md).
