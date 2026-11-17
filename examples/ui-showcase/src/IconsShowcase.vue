<script setup lang="ts">
import { computed, ref } from 'vue';
import * as icons from '@codemonster-ru/ui-icons';
import { iconCatalog, iconNames, type IconName } from '@codemonster-ru/ui-icons/catalog';
import { CmButton, CmField, CmIcon, CmInput, CmLink, CmTable, CmTabs } from '@codemonster-ru/ui-vue';
import { vScrollableTable } from './scrollable-table';

const showcaseVariants = icons.cmIconVariants;
const showcaseFamilies = [
  { id: 'classic', title: 'Classic', panel: 'panelClassic' },
  { id: 'duotone', title: 'Duotone', panel: 'panelDuotone' },
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
    <header class="showcase-intro catalog-intro">
      <h1 id="icon-catalog-heading">System and brand icons</h1>
      <p>Compare four weights in each family and copy icon names for use in code.</p>
    </header>

    <div class="catalog-toolbar">
      <CmField v-slot="{ controlId }" class="catalog-search" control-id="icon-catalog-search" label="Find an icon">
        <CmInput :id="controlId" v-model="query" type="search" placeholder="Search by name or keyword" clearable />
      </CmField>
      <p aria-live="polite">
        {{ filteredSystemIconNames.length + filteredBrandIconNames.length }} of {{ iconNames.length }} icons
        <span v-if="copyStatus">· {{ copyStatus }}</span>
      </p>
      <CmLink class="catalog-brands-link" href="#brand-icons-heading">Brand icons</CmLink>
    </div>

    <CmTabs id="icon-catalog-family" :items="familyTabs" default-value="classic">
      <template v-for="iconFamily in showcaseFamilies" :key="iconFamily.id" #[iconFamily.panel]="{ active }">
        <section v-if="active" class="family-section">
          <header class="family-heading">
            <h2>{{ iconFamily.title }}</h2>
          </header>

          <CmTable v-scrollable-table="iconFamily.title + ' icon weights'" density="compact" column-dividers>
            <template #header>
              <tr>
                <th class="catalog-name" scope="col">Icon</th>
                <th v-for="variant in showcaseVariants" :key="variant" class="catalog-weight" scope="col">
                  {{ variant }}
                </th>
              </tr>
            </template>
            <tr v-for="iconName in filteredSystemIconNames" :key="iconName">
              <th class="catalog-name" scope="row">
                <div class="catalog-entry">
                  <code>{{ iconName }}</code>
                  <CmButton
                    variant="ghost"
                    size="sm"
                    :aria-label="`Copy ${iconName} icon name`"
                    @click="copyIconName(iconName)"
                  >
                    Copy
                  </CmButton>
                </div>
              </th>
              <td v-for="variant in showcaseVariants" :key="variant" class="catalog-weight">
                <CmIcon :icon="icons[iconName]" :family="iconFamily.id" :variant="variant" />
              </td>
            </tr>
          </CmTable>
          <p v-if="filteredSystemIconNames.length === 0" class="catalog-empty">No system icons match.</p>
        </section>
      </template>
    </CmTabs>

    <section class="brand-section" aria-labelledby="brand-icons-heading">
      <header class="family-heading">
        <h2 id="brand-icons-heading">Brands</h2>
      </header>
      <div v-if="filteredBrandIconNames.length" class="brand-grid">
        <article v-for="iconName in filteredBrandIconNames" :key="iconName" class="cm-panel catalog-brand">
          <CmIcon :icon="icons[iconName]" variant="solid" />
          <code>{{ iconName }}</code>
          <CmButton
            variant="ghost"
            size="sm"
            :aria-label="`Copy ${iconName} icon name`"
            @click="copyIconName(iconName)"
          >
            Copy
          </CmButton>
        </article>
      </div>
      <p v-else class="catalog-empty">No brand icons match.</p>
    </section>
  </section>
</template>

<style src="../../shared/showcase-icon-gallery.css"></style>
