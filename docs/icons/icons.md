---
title: "Icons"
description: "Full VueForge icon catalog with search"
order: 3
---

# Icons

Browse the full icon set and quickly find the name you need.

````playground-src
mode: component
framework: vue
height: 520
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <VfInput v-model="query" placeholder="Search icon..." />

    <div :style="metaStyle">
      Showing {{ filtered.length }} of {{ iconNames.length }} icons
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
import { VfInput } from '@codemonster-ru/vueforge-core';
import { VueIconify, iconNames } from '@codemonster-ru/vueforge-icons';

const query = ref('');
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) {
    return iconNames;
  }

  return iconNames.filter((name) => name.toLowerCase().includes(q));
});

const stageStyle = {
  height: '100%',
  minHeight: '300px',
  display: 'grid',
  gap: 'var(--vf-surface-gap-compact)',
  gridTemplateRows: 'auto auto minmax(0, 1fr)'
};
const metaStyle = {
  fontSize: 'var(--vf-text-caption-font-size)',
  color: 'var(--vf-color-muted)'
};
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 'var(--vf-surface-gap-compact)',
  alignContent: 'start',
  overflow: 'auto',
  paddingRight: 'var(--vf-surface-gap-tight)'
};
const cellStyle = {
  display: 'flex',
  gap: 'var(--vf-surface-gap-compact)',
  alignItems: 'center',
  padding: 'var(--vf-surface-gap-compact)',
  border: '1px solid var(--vf-color-border)',
  borderRadius: 'var(--vf-radius-control)'
};
const nameStyle = {
  fontSize: 'var(--vf-text-caption-font-size)'
};
</script>
```
````
