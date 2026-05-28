---
title: "Features"
description: "Usage examples and behavior of Skeleton"
order: 1
---

# Features

The code snippet below illustrates this section.

```vue
<template>
  <div style="display:grid;gap:12px;max-width:420px;">
    <VfSkeleton min-height="96px" />
    <VfSkeleton :min-height="56" radius="12px" :animated="false" />
  </div>
</template>

<script setup lang="ts">
import { VfSkeleton } from '@codemonster-ru/vueforge-core';
</script>
```
