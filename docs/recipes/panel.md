# Migrate from Panel

Use `CmCard` for a bounded surface with header, body, and optional footer regions. Use `CmSection`
for an inset page section whose heading hierarchy and content remain application-owned.

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

For a transparent surface like `Panel` with `subtle`, use Section. If you need the original
border, use a surfaced Section with a transparent background set in application CSS. Check
heading size, text color, and spacing when migrating to Card, which adds a body wrapper and
applies its own typography.

## Vanilla HTML

Compose the same layout using the canonical markup for [Card](../../contracts/card/contract.md) or
[Section](../../contracts/section/contract.md). If you import styles per component, use
`@codemonster-ru/ui-css/card.css` or `@codemonster-ru/ui-css/section.css` for the replacement.
