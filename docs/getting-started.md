---
title: 'Getting started with CodeMonster UI'
description: 'Install CodeMonster UI in Vue or Annabel Razor applications'
order: 2
---

# Getting started with CodeMonster UI

CodeMonster UI publishes one shared token and CSS layer, a Vue adapter, an Annabel Razor adapter,
and an optional browser runtime for progressively enhanced server markup.

## Vue quick start

Install Vue and the three browser packages:

```bash
npm install vue @codemonster-ru/ui-vue @codemonster-ru/ui-css @codemonster-ru/ui-tokens
```

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

## Annabel Razor quick start

Install the Composer adapter:

```bash
composer require codemonster-ru/ui
```

Register its component provider during application bootstrap:

```php
<?php

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Ui\UiComponentProvider;

$components = new ComponentRegistry();
$components->register(new UiComponentProvider());
```

Render `cm` components with Razor's native attributes and slots:

```razor
<form method="post">
  <cm-field control-id="account-email" label="Email" :required="true">
    <cm-input id="account-email" name="email" type="email" :required="true" />
  </cm-field>
  <cm-button type="submit">Save account</cm-button>
</form>
```

Publish the packaged token, CSS, and runtime assets with the adapter's `AssetPublisher`. Static
components need no browser JavaScript. Register only the controllers named by an interactive
component guide, scoped away from Vue-owned subtrees.

## Next steps

- Learn the [token and theme contract](./tokens/getting-started.md).
- Choose complete or component-level entries in the [CSS guide](./css/getting-started.md).
- Start with the [Button](./components/button.md), [forms](./components/forms.md), and
  [layout primitives](./components/layout-primitives.md).
