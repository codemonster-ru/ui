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

## Annabel Razor

Server-rendered pages can use the same persistent-content structure when a progressive enhancement
updates readiness in place. The application script owns removal of `hidden` and `inert` together.

```razor
<section class="loading-gate" aria-busy="{{ $ready ? 'false' : 'true' }}" aria-labelledby="report-title">
  <h2 id="report-title">Usage report</h2>

  @if (!$ready)
    <div class="loading-gate__placeholder">
      <cm-skeleton min-height="10rem" radius="surface" />
    </div>
  @endif

  <div @if (!$ready) hidden inert @endif>
    <p>Requests: {{ $requestCount }}</p>
    <a href="/reports/usage">Open detailed report</a>
  </div>
</section>
```

If readiness is known before rendering and the content need not remain mounted, render either the
skeleton or the content. In that server-only variant, `inert` is unnecessary because unavailable
controls never enter the document.

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

