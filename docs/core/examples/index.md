---
title: "Examples"
description: "Interactive examples for the core package"
slug: "/vueforge/core/examples"
order: 5
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfThemeProvider>
    <section :style="stageStyle">
      <VfCard compact :style="cardStyle">
        <VfStack gap="12">
          <VfAlert tone="info">
            Core components rendered inside docs playground.
          </VfAlert>
          <VfButton variant="solid">
            Action
          </VfButton>
        </VfStack>
      </VfCard>
    </section>
  </VfThemeProvider>
</template>

<script setup>
import { VfAlert, VfButton, VfCard, VfStack, VfThemeProvider } from '@codemonster-ru/vueforge-core';

const stageStyle = {
  height: '100%',
  minHeight: '260px',
  display: 'grid',
  placeItems: 'center'
};
const cardStyle = {
  width: 'min(460px, 92%)'
};
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 430
entry: /App.vue

```vue file=/App.vue
<template>
  <VfThemeProvider>
    <section :style="stageStyle">
      <VfCard compact :style="cardStyle">
        <VfStack gap="12">
          <VfInput v-model="query" placeholder="Filter menu..." />
          <VfNavMenu :items="items" />
          <VfTableOfContents :items="tocItems" />
        </VfStack>
      </VfCard>
    </section>
  </VfThemeProvider>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  VfCard,
  VfInput,
  VfNavMenu,
  VfStack,
  VfTableOfContents,
  VfThemeProvider
} from '@codemonster-ru/vueforge-core';

const query = ref('');
const sourceItems = [
  { label: 'Introduction', href: '#intro' },
  { label: 'Theming', href: '#theming' },
  { label: 'Components', href: '#components' }
];
const items = computed(() =>
  sourceItems.filter((item) => item.label.toLowerCase().includes(query.value.toLowerCase()))
);
const tocItems = sourceItems.map((item) => ({ id: item.href.slice(1), label: item.label }));

const stageStyle = {
  height: '100%',
  minHeight: '330px',
  display: 'grid',
  placeItems: 'center'
};
const cardStyle = {
  width: 'min(560px, 95%)'
};
</script>
```
````

