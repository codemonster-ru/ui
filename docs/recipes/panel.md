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

## Annabel Razor

```razor
<cm-card element="section" aria-labelledby="recent-activity-title">
    <razor-slot name="header">
        <h2 id="recent-activity-title">Recent activity</h2>
    </razor-slot>

    <p>No recent deployments.</p>

    <razor-slot name="footer">
        <cm-button variant="secondary">Refresh</cm-button>
    </razor-slot>
</cm-card>

<cm-section element="section" aria-labelledby="account-notes-title">
    <h2 id="account-notes-title">Account notes</h2>
    <p>Notes use page background and shared section inset without another card surface.</p>
</cm-section>
```

Both compositions render complete server HTML and require no shared runtime. Callers own heading
levels and accessible names; do not select a level merely to match the old `VfPanel` default.
Fallback prop strings remain escaped, while authored Razor slots are trusted composition regions.
