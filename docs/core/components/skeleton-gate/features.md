---
title: "Features"
description: "Usage examples and behavior of Skeleton Gate"
order: 1
---

# Features

The code snippet below illustrates this section.

```vue
<template>
  <VfSkeletonGate :ready="ready" :min-height="180">
    <template #default>
      <article style="padding: 16px;">Loaded content</article>
    </template>
    <template #skeleton>
      <VfSkeleton :min-height="180" />
    </template>
  </VfSkeletonGate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfSkeleton, VfSkeletonGate } from '@codemonster-ru/vueforge-core';

const ready = ref(false);
</script>
```
