---
title: "VfTableOfContents"
description: "Component documentation for VfTableOfContents"
slug: "/vueforge/core/components/vf-table-of-contents"
order: 35
---

# VfTableOfContents

## Import

```ts
import { VfTableOfContents } from '@codemonster-ru/vueforge-core';
```

## Summary

Document table of contents with active section highlighting.

## Key Props

- `items: VfTableOfContentsItem[]` (required)
- `activeId?: string`
- `smooth?: boolean` (default: `false`)
- `scrollOffset?: number` (default: `0`)
- `variant?: 'default' | 'pills'` (default: `default`)

## Slots

- No public slots.

## Usage

````playground-src
mode: component
framework: vue
height: 460
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px">
    <VfTableOfContents
      :items="items"
      :active-id="activeId"
      smooth
      :scroll-offset="12"
      variant="pills"
    />

    <article style="display:grid;gap:14px">
      <section id="introduction">
        <h3 style="margin:0">Introduction</h3>
        <p style="margin:6px 0 0">Overview of package goals and design principles.</p>
      </section>
      <section id="installation">
        <h3 style="margin:0">Installation</h3>
        <p style="margin:6px 0 0">Package manager setup and versioning rules.</p>
      </section>
      <section id="vite">
        <h3 style="margin:0">Vite</h3>
        <p style="margin:6px 0 0">Vite-specific notes and plugin integration.</p>
      </section>
      <section id="configuration">
        <h3 style="margin:0">Configuration</h3>
        <p style="margin:6px 0 0">Runtime options and defaults.</p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfTableOfContents } from '@codemonster-ru/vueforge-core';

const activeId = ref('installation');
const items = [
  { id: 'introduction', label: 'Introduction', level: 1 },
  { id: 'installation', label: 'Installation', level: 1 },
  { id: 'vite', label: 'Vite', level: 2 },
  { id: 'configuration', label: 'Configuration', level: 1 },
];
</script>
```
````
