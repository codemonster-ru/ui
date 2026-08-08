<template>
  <section class="showcase-catalog" :aria-labelledby="headingId">
    <div class="showcase-catalog__header">
      <div>
        <p class="showcase-catalog__eyebrow">Component catalog</p>
        <h1 :id="headingId">{{ title }}</h1>
        <p>{{ description }}</p>
      </div>

      <label class="showcase-catalog__search">
        <span>Find a component</span>
        <input v-model="query" type="search" :placeholder="`Search ${items.length} components`" />
      </label>
    </div>

    <p class="showcase-catalog__count" aria-live="polite">
      {{ filteredItems.length }} of {{ items.length }} components
    </p>

    <div v-if="filteredItems.length" class="showcase-catalog__grid">
      <article v-for="item in filteredItems" :key="item.name" class="showcase-catalog__item">
        <h2>{{ item.name }}</h2>
        <p>{{ item.summary }}</p>
        <div class="showcase-catalog__links">
          <a :href="`#${item.sectionId}`">View examples</a>
          <a :href="item.docsUrl" target="_blank" rel="noreferrer"
            >Docs<span class="vf-sr-only"> for {{ item.name }}</span></a
          >
        </div>
      </article>
    </div>

    <p v-else class="showcase-catalog__empty">No components match “{{ query }}”.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface ShowcaseCatalogItem {
  name: string;
  summary: string;
  sectionId: string;
  docsUrl: string;
}

const props = defineProps<{
  title: string;
  description: string;
  headingId: string;
  items: readonly ShowcaseCatalogItem[];
}>();

const query = ref('');
const filteredItems = computed(() => {
  const normalizedQuery = query.value.trim().toLocaleLowerCase();
  if (!normalizedQuery) return props.items;

  return props.items.filter((item) => `${item.name} ${item.summary}`.toLocaleLowerCase().includes(normalizedQuery));
});
</script>

<style scoped>
.showcase-catalog {
  display: grid;
  gap: var(--vf-layout-space-layout-base);
  margin-bottom: var(--vf-layout-space-layout-roomy);
  padding: var(--vf-layout-section-inset-default);
  border: var(--vf-layout-border-base);
  border-radius: var(--vf-layout-section-radius);
  background: var(--vf-layout-surface-base);
}

.showcase-catalog__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--vf-layout-space-layout-roomy);
}

.showcase-catalog__header > div {
  display: grid;
  gap: calc(var(--vf-layout-space-layout-base) * 0.5);
  max-width: 48rem;
}

.showcase-catalog__eyebrow,
.showcase-catalog__header h1,
.showcase-catalog__header p,
.showcase-catalog__count,
.showcase-catalog__item h2,
.showcase-catalog__item p,
.showcase-catalog__empty {
  margin: 0;
}

.showcase-catalog__eyebrow,
.showcase-catalog__count,
.showcase-catalog__search span {
  color: var(--vf-color-text-muted);
  font-size: var(--vf-text-caption-font-size);
  font-weight: var(--vf-text-caption-font-weight);
}

.showcase-catalog__eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.showcase-catalog__header h1 {
  font-family: var(--vf-font-family-heading);
  font-size: var(--vf-heading-h-2-font-size);
  line-height: var(--vf-heading-h-2-line-height);
}

.showcase-catalog__header p,
.showcase-catalog__item p,
.showcase-catalog__empty {
  color: var(--vf-color-text-muted);
  line-height: var(--vf-text-body-line-height);
}

.showcase-catalog__search {
  display: grid;
  flex: 0 1 20rem;
  gap: calc(var(--vf-layout-space-layout-base) * 0.375);
  min-width: min(100%, 16rem);
}

.showcase-catalog__search input {
  min-height: var(--vf-control-height-md);
  padding: var(--vf-field-padding-md);
  border: var(--vf-border-width) solid var(--vf-color-border-interactive);
  border-radius: var(--vf-radius-control);
  color: var(--vf-color-text-primary);
  background: var(--vf-color-background-surface);
  font: inherit;
}

.showcase-catalog__search input:focus-visible {
  border-color: var(--vf-color-border-focus);
  outline: var(--vf-focus-ring-width) solid var(--vf-color-focus-ring);
  outline-offset: var(--vf-focus-ring-width);
}

.showcase-catalog__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--vf-layout-space-layout-base);
}

.showcase-catalog__item {
  display: grid;
  align-content: start;
  gap: calc(var(--vf-layout-space-layout-base) * 0.5);
  min-width: 0;
  padding: var(--vf-layout-space-layout-base);
  border: var(--vf-layout-border-base);
  border-radius: var(--vf-layout-radius-base);
  background: var(--vf-layout-surface-muted);
}

.showcase-catalog__item h2 {
  font-size: var(--vf-heading-h-6-font-size);
  line-height: var(--vf-heading-h-6-line-height);
}

.showcase-catalog__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vf-layout-space-layout-base);
  margin-top: auto;
  padding-top: calc(var(--vf-layout-space-layout-base) * 0.5);
}

.showcase-catalog__links a {
  color: var(--vf-color-text-link);
  font-weight: var(--vf-font-weight-medium);
}

@media (width <= 960px) {
  .showcase-catalog__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .showcase-catalog__header {
    align-items: stretch;
    flex-direction: column;
  }

  .showcase-catalog__search {
    flex-basis: auto;
  }

  .showcase-catalog__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
