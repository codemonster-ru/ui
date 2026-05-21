---
title: "Examples"
description: "Interactive examples for the playground package"
order: 5
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <VfPlayground
      mode="sandbox"
      :files="files"
      entry="/Demo.vue"
      :height="300"
    />
  </section>
</template>

<script setup>
import { VfPlayground } from '@codemonster-ru/vueforge-playground';

const stageStyle = {
  height: '100%',
  minHeight: '340px'
};

const files = {
  '/Demo.vue': `<template>
  <button style="padding:8px 12px;border:1px solid #ccc;border-radius:8px;background:#fff">
    Playground Render
  </button>
</template>`
};
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 460
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <VfPlayground
      mode="sandbox"
      :files="files"
      :entry="entry"
      framework="vue"
      :height="340"
      :show-code="true"
    />
  </section>
</template>

<script setup>
import { VfPlayground } from '@codemonster-ru/vueforge-playground';

const stageStyle = { height: '100%', minHeight: '360px' };
const entry = '/App.vue';
const files = {
  '/App.vue': `<template>
  <main style="display:grid;gap:10px">
    <h3 style="margin:0">Playground Advanced</h3>
    <button @click="count++" style="padding:8px 12px">Count: {{ count }}</button>
  </main>
</template>
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>`
};
</script>
```
````

