<template>
  <main class="demo-page">
    <div class="demo-container overview">
      <header class="overview__hero">
        <p class="overview__eyebrow">Vue 3 ecosystem</p>
        <h1>Choose the VueForge package for the job</h1>
        <p>
          Browse all eight published packages. Open a live showcase for visual behavior, or use the documentation for
          installation and API details.
        </p>
      </header>

      <div class="overview__grid">
        <article v-for="item in packages" :key="item.name" class="overview__card">
          <div>
            <p class="overview__kind">{{ item.kind }}</p>
            <h2>{{ item.label }}</h2>
            <code>{{ item.name }}</code>
          </div>
          <p>{{ item.summary }}</p>
          <div class="overview__links">
            <a :href="item.showcasePath">View showcase</a>
            <a :href="item.docsUrl" target="_blank" rel="noreferrer">Documentation</a>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const packages = [
  {
    label: 'Core',
    name: '@codemonster-ru/vueforge-core',
    kind: 'Components',
    summary: 'Accessible controls, feedback, navigation, overlays, data display, and theme integration.',
    showcasePath: '/core',
    docsUrl: 'https://docs.codemonster.net/vueforge/core/',
  },
  {
    label: 'Theme',
    name: '@codemonster-ru/vueforge-theme',
    kind: 'Foundation',
    summary: 'Framework-agnostic tokens, color modes, responsive breakpoints, and runtime theme helpers.',
    showcasePath: '/colors',
    docsUrl: 'https://docs.codemonster.net/vueforge/core/guides/theme-configuration/',
  },
  {
    label: 'Layouts',
    name: '@codemonster-ru/vueforge-layouts',
    kind: 'Components',
    summary: 'Layout primitives and responsive shells for application, admin, auth, setup, and document screens.',
    showcasePath: '/layouts',
    docsUrl: 'https://docs.codemonster.net/vueforge/layouts/',
  },
  {
    label: 'Icons',
    name: '@codemonster-ru/vueforge-icons',
    kind: 'Assets',
    summary: 'A typed Vue icon renderer with system and brand catalogs, families, weights, and metadata.',
    showcasePath: '/icons',
    docsUrl: 'https://docs.codemonster.net/vueforge/icons/',
  },
  {
    label: 'CodeBlock',
    name: '@codemonster-ru/vueforge-codeblock',
    kind: 'Components',
    summary: 'Syntax-highlighted code blocks with line numbers, copy controls, theming, and lazy language loading.',
    showcasePath: '/codeblock',
    docsUrl: 'https://docs.codemonster.net/vueforge/codeblock/',
  },
  {
    label: 'Playground',
    name: '@codemonster-ru/vueforge-playground',
    kind: 'Components',
    summary: 'The Vue UI adapter for editable browser previews, component demos, and multi-file examples.',
    showcasePath: '/playground',
    docsUrl: 'https://docs.codemonster.net/vueforge/playground/',
  },
  {
    label: 'Playground Core',
    name: '@codemonster-ru/vueforge-playground-core',
    kind: 'Runtime',
    summary: 'The framework-agnostic session, browser runtime, event, and TypeScript-worker layer behind Playground.',
    showcasePath: '/playground',
    docsUrl: 'https://docs.codemonster.net/vueforge/playground/api/',
  },
  {
    label: 'Playground Vite Plugin',
    name: '@codemonster-ru/vueforge-playground-vite-plugin',
    kind: 'Build tooling',
    summary: 'Vite virtual modules that turn repository examples into lazy, production-built component previews.',
    showcasePath: '/playground',
    docsUrl: 'https://docs.codemonster.net/vueforge/playground/guides/',
  },
] as const;
</script>

<style scoped>
.overview {
  display: grid;
  gap: var(--vf-layout-space-layout-roomy);
}

.overview__hero {
  display: grid;
  gap: calc(var(--vf-layout-space-layout-base) * 0.5);
  max-width: 52rem;
}

.overview__eyebrow,
.overview__hero h1,
.overview__hero p,
.overview__card h2,
.overview__card p {
  margin: 0;
}

.overview__eyebrow,
.overview__kind {
  color: var(--vf-color-text-muted);
  font-size: var(--vf-text-caption-font-size);
  font-weight: var(--vf-text-caption-font-weight);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overview__hero h1 {
  font-family: var(--vf-font-family-heading);
  font-size: var(--vf-heading-h-1-font-size);
  line-height: var(--vf-heading-h-1-line-height);
}

.overview__hero p,
.overview__card > p {
  color: var(--vf-color-text-muted);
  line-height: var(--vf-text-body-line-height);
}

.overview__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--vf-layout-space-layout-base);
}

.overview__card {
  display: grid;
  align-content: start;
  gap: var(--vf-layout-space-layout-base);
  min-width: 0;
  padding: var(--vf-layout-section-inset-default);
  border: var(--vf-layout-border-base);
  border-radius: var(--vf-layout-section-radius);
  background: var(--vf-layout-surface-base);
}

.overview__card > div:first-child {
  display: grid;
  gap: calc(var(--vf-layout-space-layout-base) * 0.375);
}

.overview__card h2 {
  font-size: var(--vf-heading-h-4-font-size);
  line-height: var(--vf-heading-h-4-line-height);
}

.overview__card code {
  overflow-wrap: anywhere;
  color: var(--vf-color-text-muted);
}

.overview__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vf-layout-space-layout-base);
  margin-top: auto;
}

.overview__links a {
  color: var(--vf-color-text-link);
  font-weight: var(--vf-font-weight-medium);
}

@media (width <= 720px) {
  .overview__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
