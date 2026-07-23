---
title: 'SkeletonGate + Async Recipe'
description: 'Reusable pattern for async component loading with skeleton placeholders'
order: 1
---

# SkeletonGate + Async Recipe

Use this recipe when a heavy component is lazy-loaded and should appear only after it becomes visually ready.

## Why This Pattern

The following items are listed in this section:

- `createAsyncWithSkeleton` covers the chunk-loading phase.
- `VfSkeletonGate` covers the post-mount readiness phase.
- `normalizeContentSpacing` helps avoid skeleton/content height mismatch when the child has outer margins.

## Recipe

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSkeletonGate
    :ready="ready"
    :min-height="estimatedHeight"
    :reserve-height="estimatedHeight"
    :preserve-last-height="true"
    :normalize-content-spacing="true"
    radius="var(--vf-radius-overlay)"
  >
    <template #skeleton>
      <VfSkeleton :min-height="estimatedHeight" radius="var(--vf-radius-overlay)" />
    </template>

    <AsyncHeavyWidget
      :min-height="estimatedHeight"
      @ready="onReady"
      @preview-ready="onReady"
      @error="onReady"
    />
  </VfSkeletonGate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createAsyncWithSkeleton } from '@codemonster-ru/vueforge-core/async';
import { VfSkeleton } from '@codemonster-ru/vueforge-core/skeleton';
import { VfSkeletonGate } from '@codemonster-ru/vueforge-core/skeleton-gate';

const estimatedHeight = '320px';
const ready = ref(false);

const AsyncHeavyWidget = createAsyncWithSkeleton({
  loader: () => import('./HeavyWidget.vue'),
  defaultMinHeight: estimatedHeight,
  radius: 'var(--vf-radius-overlay)',
  delay: 0,
});

const onReady = () => {
  ready.value = true;
};
</script>
```

```vue file=/HeavyWidget.vue
<template>
  <article :style="{ minHeight: props.minHeight }">
    <h2>Heavy widget</h2>
    <p>Async content is ready.</p>
  </article>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const props = defineProps<{
  minHeight?: string;
}>();

const emit = defineEmits<{
  ready: [];
  'preview-ready': [];
  error: [error: unknown];
}>();

onMounted(() => {
  emit('ready');
});
</script>
```
````

## Notes

The following items are listed in this section:

- Keep one height source of truth (`estimatedHeight`) for async fallback + gate + content container.
- Emit `ready` only after first stable visual paint in heavy components.
- For components with dual runtime phases (for example code/preview), listen to both `ready` and `preview-ready`.
