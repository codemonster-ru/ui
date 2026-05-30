---
title: "Features"
description: "Usage examples and behavior of Skeleton Gate"
order: 1
---

# Features

The code snippet below illustrates this section.

```vue
<template>
  <VfSkeletonGate
    :ready="ready"
    :reserve-height="180"
    :preserve-last-height="true"
    :normalize-content-spacing="true"
  >
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
import { VfSkeleton } from '@codemonster-ru/vueforge-core/skeleton';
import { VfSkeletonGate } from '@codemonster-ru/vueforge-core/skeleton-gate';

const ready = ref(false);
</script>
```

Use `normalizeContentSpacing` when the gated content has outer margins (for example `VfCodeBlock`) and you need tighter skeleton-to-content height matching.
