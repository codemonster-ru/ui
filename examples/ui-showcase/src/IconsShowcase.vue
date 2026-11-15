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
  <section id="icon-catalog" class="icon-catalog" aria-labelledby="icon-catalog-heading">
    <header class="page-heading">
      <div>
        <p class="eyebrow">Complete icon catalog</p>
        <h1 id="icon-catalog-heading">System and brand icons</h1>
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
            <h2>{{ iconFamily.title }}</h2>
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
                <CmIcon :icon="icons[iconName]" :family="iconFamily.id" :variant="variant" />
              </span>
            </div>
          </div>
          <p v-if="filteredSystemIconNames.length === 0" class="catalog-empty">No system icons match.</p>
        </section>
      </template>
    </CmTabs>

    <section class="brand-section" aria-labelledby="brand-icons-heading">
      <header class="family-heading">
        <h2 id="brand-icons-heading">Brands</h2>
        <p>Trademark assets use their approved single-color shape and the solid variant.</p>
      </header>
      <div v-if="filteredBrandIconNames.length" class="brand-grid">
        <article v-for="iconName in filteredBrandIconNames" :key="iconName" class="brand-card">
          <CmIcon :icon="icons[iconName]" variant="solid" />
          <strong>{{ iconName }}</strong>
          <button type="button" :aria-label="`Copy ${iconName} icon name`" @click="copyIconName(iconName)">Copy</button>
        </article>
      </div>
      <p v-else class="catalog-empty">No brand icons match.</p>
    </section>
  </section>
</template>

<style src="../../shared/showcase-icon-gallery.css"></style>
