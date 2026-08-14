# Error page recipe

This recipe replaces `VfErrorLayout` with a semantic error document composed from Container, Stack,
Section, Inline, and Button. Error copy and recovery routes are application decisions, so the
composition remains a recipe rather than a cross-platform component.

Load the shared token and component stylesheets once at the application entry point. The
`error-page` rules below belong to the application.

## Vue

```vue
<script setup lang="ts">
import { CmButton, CmContainer, CmInline, CmSection, CmStack } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmContainer element="main" size="md" class="error-page" aria-labelledby="error-title">
    <CmSection element="article" surface>
      <CmStack>
        <p class="error-page__code" aria-hidden="true">404</p>
        <h1 id="error-title">Page not found</h1>
        <p class="error-page__description">
          The page you requested does not exist or may have moved.
        </p>
        <CmInline class="error-page__actions" aria-label="Recovery actions">
          <CmButton href="/" variant="primary">Go home</CmButton>
          <CmButton href="/support" variant="secondary">Contact support</CmButton>
        </CmInline>
      </CmStack>
    </CmSection>
  </CmContainer>
</template>

<style scoped>
.error-page {
  display: grid;
  min-block-size: 100dvh;
  align-content: center;
  padding-block: var(--cm-space-8);
}

.error-page__code {
  margin: 0;
  color: var(--cm-color-text-secondary);
  font-size: var(--cm-font-size-lg);
}

.error-page__description {
  color: var(--cm-color-text-secondary);
}
</style>
```

## Annabel Razor

```razor
<cm-container element="main" size="md" class="error-page" aria-labelledby="error-title">
  <cm-section element="article" :surface="true">
    <cm-stack>
      <p class="error-page__code" aria-hidden="true">404</p>
      <h1 id="error-title">Page not found</h1>
      <p class="error-page__description">
        The page you requested does not exist or may have moved.
      </p>
      <cm-inline class="error-page__actions" aria-label="Recovery actions">
        <cm-button href="/" variant="primary">Go home</cm-button>
        <cm-button href="/support" variant="secondary">Contact support</cm-button>
      </cm-inline>
    </cm-stack>
  </cm-section>
</cm-container>
```

Reuse the application CSS from the Vue example. The CodeMonster UI adapters only own the stable
component classes that they render.

## Application-owned policy

- Choose the status code, safe public message, support destination, retry behavior, logging, and
  router integration in the application. Do not expose exception details in the recipe.
- A full error document normally needs no `role="alert"`: its heading and document title provide
  context on navigation. If an error view replaces existing content without navigation, the
  application owns focus placement or a suitable live announcement.
- Use `element="main"` only when this is the document's main landmark. Nested router views should
  keep the host shell's existing landmark instead.
- Recovery actions use links because they navigate. Use a button only for an immediate application
  action such as retry, and keep its pending/error state in that application.

