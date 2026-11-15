<script setup lang="ts">
import { computed, ref } from 'vue';
import * as icons from '@codemonster-ru/ui-icons';
import { iconCatalog, iconNames, type IconName } from '@codemonster-ru/ui-icons/catalog';
import { CmIcon, CmInput, CmTabs } from '@codemonster-ru/ui-vue';

const showcaseVariants = icons.cmIconVariants;
const showcaseFamilies = [
  { id: 'classic', title: 'Classic', description: 'Original single-color family.', panel: 'panelClassic' },
  {
    id: 'duotone',
    title: 'Duotone',
    description: 'Two-color Solid; outline weights match Classic.',
    panel: 'panelDuotone',
  },
] as const;
const familyTabs = showcaseFamilies.map(({ id, title }) => ({ value: id, label: title, content: '' }));
const query = ref('');
const copyStatus = ref('');
const systemIconNames = iconNames.filter((name) => !iconCatalog[name].brand);
const brandIconNames = iconNames.filter((name) => iconCatalog[name].brand);
const normalizedQuery = computed(() => query.value.trim().toLowerCase());
function matchesQuery(name: IconName) {
  const { keywords, title } = iconCatalog[name];
  return [name, title, ...keywords].join(' ').toLowerCase().includes(normalizedQuery.value);
}
const filteredSystemIconNames = computed(() => systemIconNames.filter(matchesQuery));
const filteredBrandIconNames = computed(() => brandIconNames.filter(matchesQuery));

async function copyIconName(name: string) {
  try {
    await navigator.clipboard.writeText(name);
    copyStatus.value = `Copied ${name}`;
  } catch {
    copyStatus.value = 'Copy failed';
  }
}
</script>

<template>
  <section class="icon-catalog" aria-labelledby="icon-catalog-heading">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Complete icon catalog</p>
        <h2 id="icon-catalog-heading">System and brand icons</h2>
      </div>
      <p>Find an icon, compare every system weight at 32 px, and copy its typed catalog name.</p>
    </header>

    <div class="catalog-toolbar">
      <label class="catalog-search">
        <span>Find an icon</span>
        <CmInput v-model="query" type="search" placeholder="Search by name or keyword" clearable />
      </label>
      <p aria-live="polite">
        {{ filteredSystemIconNames.length + filteredBrandIconNames.length }} of {{ iconNames.length }} icons
        <span v-if="copyStatus">· {{ copyStatus }}</span>
      </p>
    </div>

    <CmTabs id="icon-catalog-family" class="family-tabs" :items="familyTabs" default-value="classic">
      <template v-for="iconFamily in showcaseFamilies" :key="iconFamily.id" #[iconFamily.panel]="{ active }">
        <section v-if="active" class="family-section">
          <header class="family-heading">
            <h3>{{ iconFamily.title }}</h3>
            <p>{{ iconFamily.description }}</p>
          </header>

          <div class="variant-table" role="table" tabindex="0" :aria-label="iconFamily.title + ' icon weights'">
            <div class="variant-row variant-row--head" role="row">
              <strong role="columnheader">Icon</strong>
              <strong v-for="variant in showcaseVariants" :key="variant" role="columnheader">{{ variant }}</strong>
            </div>
            <div v-for="iconName in filteredSystemIconNames" :key="iconName" class="variant-row" role="row">
              <div class="icon-identity" role="rowheader">
                <strong>{{ iconName }}</strong>
                <button type="button" :aria-label="`Copy ${iconName} icon name`" @click="copyIconName(iconName)">
                  Copy
                </button>
              </div>
              <span v-for="variant in showcaseVariants" :key="variant" role="cell">
                <CmIcon :icon="icons[iconName]" :family="iconFamily.id" :variant="variant" class="catalog-symbol" />
              </span>
            </div>
          </div>
          <p v-if="filteredSystemIconNames.length === 0" class="catalog-empty">No system icons match.</p>
        </section>
      </template>
    </CmTabs>

    <section class="brand-section" aria-labelledby="brand-icons-heading">
      <header class="family-heading">
        <h3 id="brand-icons-heading">Brands</h3>
        <p>Trademark assets use their approved single-color shape and the solid variant.</p>
      </header>
      <div v-if="filteredBrandIconNames.length" class="brand-grid">
        <article v-for="iconName in filteredBrandIconNames" :key="iconName" class="brand-card">
          <CmIcon :icon="icons[iconName]" variant="solid" class="catalog-symbol" />
          <strong>{{ iconName }}</strong>
          <button type="button" :aria-label="`Copy ${iconName} icon name`" @click="copyIconName(iconName)">Copy</button>
        </article>
      </div>
      <p v-else class="catalog-empty">No brand icons match.</p>
    </section>
  </section>
</template>

<style scoped>
.icon-catalog {
  --showcase-surface: var(--cm-color-background-surface, #fff);
  --showcase-text: var(--cm-color-text-primary, #18202d);
  --showcase-muted: var(--cm-color-text-muted, #687386);
  --showcase-border: var(--cm-color-border-default, #d9dee7);
  --showcase-divider: var(--cm-color-border-divider, var(--showcase-border));
  --showcase-accent: var(--cm-color-interactive-primary-background, #5b5bd6);
  --showcase-radius: var(--cm-radius-surface, 12px);
  --showcase-space: var(--cm-space-4, 16px);

  min-height: 100%;
  color: var(--showcase-text);
  font-family: var(--cm-font-family-base, Inter, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--cm-text-body-font-size, 14px);
  line-height: var(--cm-text-body-line-height, 1.45);
}

.page-heading,
.family-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--showcase-space);
}

.page-heading {
  margin-bottom: calc(var(--showcase-space) * 2);
}

.page-heading > p,
.family-heading p {
  max-width: 520px;
  margin: 0;
  color: var(--showcase-muted);
  text-align: right;
}

.eyebrow {
  margin: 0;
  color: var(--showcase-accent);
  font-size: var(--cm-text-caption-font-size, 11px);
  font-weight: var(--cm-text-caption-font-weight, 700);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2,
h3 {
  margin: 0;
  font-family: var(--cm-font-family-heading, inherit);
}

h2 {
  font-size: 1.4375rem;
  font-weight: var(--cm-font-weight-semibold, 600);
  line-height: 1.3;
}

.family-tabs :deep(.cm-tabs__panel) {
  padding: var(--cm-space-6) 0 0;
}

.catalog-symbol {
  inline-size: 2rem;
  block-size: 2rem;
}

.catalog-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--showcase-space);
  margin-bottom: var(--showcase-space);
}

.catalog-toolbar p,
.catalog-empty {
  margin: 0;
  color: var(--showcase-muted);
}

.catalog-search {
  display: grid;
  flex: 0 1 24rem;
  gap: 6px;
}

.catalog-search span {
  color: var(--showcase-muted);
  font-size: var(--cm-text-caption-font-size, 11px);
  font-weight: var(--cm-text-caption-font-weight, 700);
}

.family-heading {
  align-items: baseline;
  margin-bottom: 12px;
}

.family-heading p {
  font-size: 12px;
}

.variant-table {
  overflow: hidden;
  border: var(--cm-border-width, 1px) solid var(--showcase-border);
  border-radius: var(--showcase-radius);
  background: var(--showcase-surface);
}

.variant-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) repeat(4, minmax(80px, 0.5fr));
  align-items: center;
  min-height: 64px;
  border-top: 1px solid var(--showcase-divider);
}

.variant-row:first-child {
  border-top: 0;
}

.variant-row > * {
  display: grid;
  height: 100%;
  place-items: center;
  border-left: 1px solid var(--showcase-divider);
}

.variant-row--head > :first-child {
  justify-content: start;
}

.variant-row > :first-child {
  padding-inline: var(--cm-space-4);
  border-left: 0;
}

.variant-row > .icon-identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.icon-identity button,
.brand-card button {
  padding: 4px 8px;
  border: 1px solid var(--showcase-border);
  border-radius: var(--cm-radius-control, 8px);
  color: var(--showcase-text);
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.icon-identity button:focus-visible,
.brand-card button:focus-visible {
  border-color: var(--cm-color-border-focus, var(--showcase-accent));
  outline: var(--cm-focus-ring-width, 2px) solid var(--cm-color-focus-ring, var(--showcase-accent));
  outline-offset: var(--cm-focus-ring-width, 2px);
}

.catalog-empty {
  padding: var(--showcase-space);
}

.brand-section {
  margin-top: calc(var(--showcase-space) * 2);
}

.brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--showcase-space);
}

.brand-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: var(--showcase-space);
  border: var(--cm-border-width, 1px) solid var(--showcase-border);
  border-radius: var(--showcase-radius);
  background: var(--showcase-surface);
}

.variant-row--head {
  min-height: 40px;
  color: var(--showcase-muted);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (width <= 620px) {
  .page-heading,
  .family-heading {
    align-items: start;
    flex-direction: column;
  }

  .page-heading > p,
  .family-heading p {
    text-align: left;
  }

  .catalog-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .catalog-search {
    flex-basis: auto;
  }

  .variant-table {
    overflow-x: auto;
  }

  .variant-row {
    min-width: 560px;
  }
}
</style>
