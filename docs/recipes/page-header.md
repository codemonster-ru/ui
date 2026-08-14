# Page header recipe

Use this maintained recipe when migrating `VfPageHeader`. A page header combines document hierarchy,
navigation, product copy, and application actions; those choices belong to the page rather than a
new portable wrapper. `CmStack`, `CmInline`, and `CmBreadcrumbs` provide the reusable presentation.

## Vue recipe

```vue
<script setup lang="ts">
import { CmBreadcrumbs, CmButton, CmInline, CmStack } from '@codemonster-ru/ui-vue';

const breadcrumbs = [
  { label: 'Projects', href: '/projects' },
  { label: 'Atlas', current: true },
];
</script>

<template>
  <header class="page-header">
    <CmStack>
      <CmBreadcrumbs :items="breadcrumbs" aria-label="Project breadcrumb" />

      <CmInline class="page-header__row">
        <div class="page-header__content">
          <h1 class="page-header__title">Atlas</h1>
          <p class="page-header__description">Manage environments, releases, and access.</p>
        </div>

        <CmInline class="page-header__actions" aria-label="Project actions">
          <CmButton href="/projects/atlas/settings" variant="secondary">Settings</CmButton>
          <CmButton type="button">Create release</CmButton>
        </CmInline>
      </CmInline>
    </CmStack>
  </header>
</template>

<style scoped>
.page-header__row {
  justify-content: space-between;
  align-items: flex-end;
}

.page-header__content {
  min-inline-size: min(100%, 24rem);
}

.page-header__title,
.page-header__description {
  margin: 0;
}

.page-header__title {
  color: var(--cm-color-text-primary);
  font-family: var(--cm-font-family-heading);
  font-size: var(--cm-font-size-2xl);
  line-height: var(--cm-line-height-tight);
}

.page-header__description {
  margin-block-start: var(--cm-space-2);
  color: var(--cm-color-text-secondary);
}

@media (width < 40rem) {
  .page-header__row,
  .page-header__actions {
    align-items: stretch;
  }

  .page-header__row {
    flex-direction: column;
  }
}
</style>
```

Choose the native heading level from the surrounding document. A page title is normally `h1`; a
header nested inside a larger document section may need another level. This replaces
`heading-level` with an explicit semantic decision visible in the template.

## Annabel Razor recipe

```razor
<header class="page-header">
    <cm-stack>
        <cm-breadcrumbs
            :items="[
                ['label' => 'Projects', 'href' => '/projects'],
                ['label' => $project->name, 'current' => true],
            ]"
            aria-label="Project breadcrumb"
        />

        <cm-inline class="page-header__row">
            <div class="page-header__content">
                <h1 class="page-header__title">{{ $project->name }}</h1>
                <p class="page-header__description">{{ $project->summary }}</p>
            </div>

            <cm-inline class="page-header__actions" aria-label="Project actions">
                <cm-button href="{{ $settingsUrl }}" variant="secondary">Settings</cm-button>
                <cm-button type="button" data-create-release>Create release</cm-button>
            </cm-inline>
        </cm-inline>
    </cm-stack>
</header>
```

Use the same unscoped application CSS selectors from the Vue recipe. Interpolated Razor values stay
escaped; application code remains responsible for allowing safe navigation destinations. No shared
client runtime is required unless one of the composed actions needs its own enhancement.

## Migration boundary

- Replace `title` and `description` props with native page markup so document hierarchy and copy are
  reviewable at the call site.
- Replace the `breadcrumbs` prop with `CmBreadcrumbs`; use a specific accessible label when the page
  contains another breadcrumb landmark.
- Keep actions in document order after the title content. Visual alignment must not move them ahead
  of the heading for keyboard or reading order.
- Routing, authorization, action visibility, sticky positioning, and responsive shell behavior stay
  application-owned.
