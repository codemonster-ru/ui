---
title: "Examples"
description: "Interactive examples for the icons package"
slug: "/vueforge/icons/examples"
order: 5
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <div :style="stageStyle">
    <div :style="rowStyle">
      <VueIconify icon="sparkles" />
      <VueIconify icon="github" />
      <VueIconify icon="arrowRightLong" />
      <VueIconify icon="checkCircle" />
    </div>
    <p :style="captionStyle">
      Icon names are type-safe and reusable across VueForge packages.
    </p>
  </div>
</template>

<script setup>
import { VueIconify } from '@codemonster-ru/vueforge-icons';

const stageStyle = {
  height: '100%',
  minHeight: '220px',
  display: 'grid',
  placeItems: 'center',
  gap: '14px'
};
const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  fontSize: '28px'
};
const captionStyle = {
  margin: '0',
  color: 'var(--vf-color-text-muted)'
};
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <div :style="toolbarStyle">
      <input v-model="query" placeholder="Search icon..." :style="inputStyle" />
    </div>
    <div :style="gridStyle">
      <div v-for="name in filtered" :key="name" :style="cellStyle">
        <VueIconify :icon="name" :size="22" />
        <span :style="nameStyle">{{ name }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { VueIconify, iconNames } from '@codemonster-ru/vueforge-icons';

const query = ref('');
const filtered = computed(() =>
  iconNames.filter((name) => name.toLowerCase().includes(query.value.toLowerCase())).slice(0, 12)
);

const stageStyle = { height: '100%', minHeight: '260px', display: 'grid', gap: '10px' };
const toolbarStyle = { display: 'flex' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' };
const cellStyle = { display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px' };
const nameStyle = { fontSize: '12px' };
</script>
```
````

