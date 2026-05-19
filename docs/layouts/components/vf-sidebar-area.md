---
title: "VfSidebarArea"
description: "Component documentation for VfSidebarArea"
slug: "/vueforge/layouts/components/vf-sidebar-area"
order: 21
---

# VfSidebarArea

## Import

```ts
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Sidebar region for navigation trees and supporting controls.

## Key Props

- `as?: string` (default: `aside`)
- `appearance?: 'default' | 'plain'` (default: `default`)

## Slots

- `default`

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSidebarArea style="border:1px solid #e5e7eb;border-radius:10px">
    <nav style="display:grid;gap:6px">
      <a href="#intro">Introduction</a>
      <a href="#install">Installation</a>
      <a href="#api">API</a>
    </nav>
  </VfSidebarArea>
</template>

<script setup>
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
