---
title: "VfTable"
description: "Component documentation for VfTable"
slug: "/vueforge/core/components/vf-table"
order: 23
---

# VfTable

## Import

```ts
import { VfTable } from '@codemonster-ru/vueforge-core';
```

## Summary

Table wrapper with optional caption, compact mode, stripes, and sticky header.

## Key Props

- `caption?: string`
- `compact?: boolean` (default: `false`)
- `striped?: boolean` (default: `false`)
- `stickyHeader?: boolean` (default: `false`)

## Slots

- `caption`
- `header`
- `default` (table body rows)
- `footer`

## Usage

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTable caption="Top contributors" striped>
    <template #header>
      <tr>
        <th>Name</th>
        <th>Commits</th>
      </tr>
    </template>

    <tr>
      <td>Alice</td>
      <td>42</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>27</td>
    </tr>
  </VfTable>
</template>

<script setup>
import { VfTable } from '@codemonster-ru/vueforge-core';
</script>
```
````
