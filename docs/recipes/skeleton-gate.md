# Skeleton loading gate recipe

This recipe replaces the portable part of `VfSkeletonGate`: the application exposes a busy
container, prevents interaction with unavailable content, and composes `CmSkeleton` as a decorative
placeholder. Loading and content stay in the document so an already-mounted view can be gated again.

`CmSkeleton` deliberately owns no readiness state or live announcement. Load the shared token and
component stylesheets once at the application entry point.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmSkeleton } from '@codemonster-ru/ui-vue';

const ready = ref(false);

function revealReport() {
  ready.value = true;
}
</script>

<template>
  <section class="loading-gate" :aria-busy="ready ? 'false' : 'true'" aria-labelledby="report-title">
    <h2 id="report-title">Usage report</h2>

    <div v-if="!ready" class="loading-gate__placeholder">
      <CmSkeleton min-height="10rem" radius="surface" />
      <CmButton type="button" variant="secondary" @click="revealReport">Finish example load</CmButton>
    </div>

    <div :hidden="!ready" :inert="!ready">
      <p>Requests: 12,480</p>
      <a href="/reports/usage">Open detailed report</a>
    </div>
  </section>
</template>

<style scoped>
.loading-gate,
.loading-gate__placeholder {
  display: grid;
  gap: var(--cm-space-4);
}
</style>
```

The example button only makes the documentation example operable. In an application, set `ready`
from the owning request, lazy module, image decode, or editor-ready signal.

## Vanilla HTML

Compose the same layout using the canonical markup for [skeleton](../../contracts/skeleton/contract.md).
Load styles and initialize interactive components as described in the [Vanilla guide](../vanilla.md).

## Application-owned policy

- The application owns the asynchronous operation, cancellation, failure and empty states, retry
  policy, and the moment at which content is visually ready.
- `aria-busy` belongs on the smallest meaningful region. Add a separate status or live region only
  when users need a loading announcement; `CmSkeleton` stays `aria-hidden="true"`.
- Toggle `hidden` and `inert` together when content remains mounted. This prevents unavailable links,
  controls, and editable content from receiving focus or pointer input.
- Reserved or minimum height may be an application estimate passed to `CmSkeleton`. Reading the
  previous DOM height, observing resize, normalizing child margins, and animating the transition are
  lifecycle and presentation policies, not CodeMonster UI behavior.
- Prefer CSS that respects reduced motion. Shared Skeleton shimmer already stops under the user's
  reduced-motion preference.
