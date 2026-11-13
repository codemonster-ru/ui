# Panel recipe

`VfPanel` is structural and does not require a permanent wrapper API. Use `CmCard` for a bounded
surface with header, body, and optional footer regions. Use `CmSection` for an inset page section
whose heading hierarchy and content remain application-owned.

## Vue

```vue
<script setup lang="ts">
import { CmButton, CmCard, CmSection } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmCard element="section" aria-labelledby="recent-activity-title">
    <template #header>
      <h2 id="recent-activity-title">Recent activity</h2>
    </template>

    <p>No recent deployments.</p>

    <template #footer>
      <CmButton variant="secondary">Refresh</CmButton>
    </template>
  </CmCard>

  <CmSection element="section" aria-labelledby="account-notes-title">
    <h2 id="account-notes-title">Account notes</h2>
    <p>Notes use page background and shared section inset without another card surface.</p>
  </CmSection>
</template>
```

`CmCard title="Recent activity"` is the concise replacement when its fixed `h3` fits the page
outline. Prefer the header slot when the application must select another heading level or combine
the heading with actions. Card supplies the bounded surface; Section supplies inset only unless
`surface` is set.

VueForge's `subtle` flag was a theme-specific visual variant, not behavior. Choose Card or Section
from the information hierarchy. If a product needs an additional tinted surface, add an
application class using public `--cm-*` tokens after design review rather than introducing a
cross-platform boolean with no semantic meaning.

## Vanilla HTML

Compose the same layout using the canonical markup for [card](../../contracts/card/contract.md).
Load styles and initialize interactive components as described in the [Vanilla guide](../vanilla.md).
