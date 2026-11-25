<script setup lang="ts">
import { computed, ref } from 'vue';
import * as icons from '@codemonster-ru/ui-icons';
import { iconCatalog, iconNames, type IconName } from '@codemonster-ru/ui-icons/catalog';
import { CmButton, CmField, CmIcon, CmInput, CmSection, CmTable } from '@codemonster-ru/ui-vue';
import { iconCountLabel } from '../../shared/showcase-icon-catalog.js';
import { vScrollableTable } from './scrollable-table';

const systemFamilies = [
  { family: 'classic', label: 'Classic', variants: icons.cmIconVariants },
  { family: 'duotone', label: 'Duotone', variants: icons.cmIconVariants },
] as const;
const brandFamilies = [{ family: 'classic', label: 'Classic', variants: ['solid'] }] as const;

const query = ref('');
const copyStatus = ref('');
const iconGroups = [
  {
    id: 'system-icons-heading',
    label: 'System',
    empty: 'No system icons match.',
    names: iconNames.filter((name) => !iconCatalog[name].brand),
    families: systemFamilies,
  },
  {
    id: 'brand-icons-heading',
    label: 'Brands',
    empty: 'No brand icons match.',
    names: iconNames.filter((name) => iconCatalog[name].brand),
    families: brandFamilies,
  },
];
const searchTerms = computed(() => query.value.trim().toLowerCase().split(/\s+/u));
const searchableText = new Map(
  iconNames.map((name) => {
    const { keywords, title } = iconCatalog[name];
    return [name, [name, title, ...keywords].join(' ').toLowerCase()];
  }),
);
const filteredGroups = computed(() =>
  iconGroups.map((group) => ({
    ...group,
    names: group.names.filter((name) => searchTerms.value.every((term) => searchableText.get(name)!.includes(term))),
  })),
);
const resultCount = computed(() => filteredGroups.value.reduce((total, group) => total + group.names.length, 0));

async function copyIconName(name: IconName) {
  try {
    await navigator.clipboard.writeText(name);
    copyStatus.value = `Copied ${name}`;
  } catch {
    copyStatus.value = 'Copy failed';
  }
}
</script>

<template>
  <section id="icon-catalog" class="icon-catalog" aria-label="Icons">
    <div class="catalog-toolbar">
      <CmField v-slot="{ controlId }" class="catalog-search" control-id="icon-catalog-search" label="Search icons">
        <CmInput :id="controlId" v-model="query" type="search" clearable />
      </CmField>
      <p>Click an icon name to copy it.</p>
      <p class="catalog-results" aria-live="polite">
        <span data-icon-count :data-total="iconNames.length">{{ iconCountLabel(resultCount, iconNames.length) }}</span>
        <span data-icon-copy-status>{{ copyStatus ? ` · ${copyStatus}` : '' }}</span>
      </p>
    </div>

    <CmSection
      v-for="{ id, label, empty, names, families } in filteredGroups"
      :key="id"
      surface
      class="showcase-group"
      :aria-labelledby="id"
      data-icon-group
    >
      <h2 :id="id" class="showcase-component-title">{{ label }}</h2>
      <CmTable
        v-scrollable-table="`${label} icon comparison`"
        class="catalog-table"
        density="compact"
        column-dividers
        :hidden="names.length === 0"
        data-icon-table
      >
        <template #header>
          <tr>
            <th class="catalog-name" rowspan="2" scope="col">Icon</th>
            <th
              v-for="{ family, label: familyLabel, variants } in families"
              :id="`${id}-${family}`"
              :key="family"
              :colspan="variants.length"
              class="catalog-family"
            >
              {{ familyLabel }}
            </th>
          </tr>
          <tr>
            <template v-for="{ family, variants } in families" :key="family">
              <th
                v-for="variant in variants"
                :id="`${id}-${family}-${variant}`"
                :key="variant"
                :headers="`${id}-${family}`"
                class="catalog-variant"
                scope="col"
              >
                {{ variant }}
              </th>
            </template>
          </tr>
        </template>
        <tr v-for="name in names" :key="name" :data-icon-name="name" :data-icon-search="searchableText.get(name)">
          <th :id="`icon-row-${name}`" class="catalog-name" scope="row">
            <CmButton
              class="catalog-copy"
              variant="ghost"
              size="sm"
              :aria-label="`Copy ${name}`"
              data-copy-icon
              @click="copyIconName(name)"
            >
              {{ name }}
            </CmButton>
          </th>
          <template v-for="{ family, variants } in families" :key="family">
            <td
              v-for="variant in variants"
              :key="variant"
              :headers="`icon-row-${name} ${id}-${family} ${id}-${family}-${variant}`"
            >
              <CmIcon
                v-if="icons[name][`${family}/${variant}`]"
                :icon="icons[name]"
                :family="family"
                :variant="variant"
                :size="24"
              />
              <span v-else title="Unavailable">—</span>
            </td>
          </template>
        </tr>
      </CmTable>
      <p data-icon-empty :hidden="names.length > 0" class="catalog-empty">{{ empty }}</p>
    </CmSection>
  </section>
</template>

<style src="../../shared/showcase-icon-gallery.css"></style>
