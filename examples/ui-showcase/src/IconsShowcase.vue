<script setup lang="ts">
import { computed, ref } from 'vue';
import * as icons from '@codemonster-ru/ui-icons';
import { iconCatalog, iconNames, type IconName } from '@codemonster-ru/ui-icons/catalog';
import {
  CmBadge,
  CmButton,
  CmField,
  CmGrid,
  CmIcon,
  CmInline,
  CmInput,
  CmLink,
  CmPanel,
  CmStack,
} from '@codemonster-ru/ui-vue';
import { iconCountLabel } from '../../shared/showcase-icon-catalog.js';

defineProps<{ staticPreview?: boolean }>();

const showcaseVariants = icons.cmIconVariants;
const showcaseFamilies = [
  { id: 'classic', title: 'Classic' },
  { id: 'duotone', title: 'Duotone' },
] as const;
const sizes = [16, 24, 32, 48];
const query = ref('');
const copyStatus = ref('');
const iconGroups = [
  {
    id: 'system-icons-heading',
    label: 'System',
    empty: 'No system icons match.',
    names: iconNames.filter((name) => !iconCatalog[name].brand),
  },
  {
    id: 'brand-icons-heading',
    label: 'Brands',
    empty: 'No brand icons match.',
    names: iconNames.filter((name) => iconCatalog[name].brand),
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
  <section id="icon-catalog" class="icon-catalog" aria-labelledby="icon-catalog-heading">
    <header class="showcase-intro catalog-intro">
      <h1 id="icon-catalog-heading">Icons</h1>
    </header>

    <CmPanel class="showcase-group" aria-labelledby="component-icon">
      <CmStack id="demo-icon" data-showcase-component="icon">
        <h2 id="component-icon" class="showcase-component-title">Icon</h2>
        <CmGrid class="showcase-variants catalog-demos">
          <CmStack class="showcase-variant" data-icon-styles>
            <h3 class="showcase-variant-title">Style</h3>
            <CmGrid class="catalog-styles">
              <span v-for="variant in showcaseVariants" :key="variant" class="catalog-weight">{{ variant }}</span>
              <template v-for="family in showcaseFamilies" :key="family.id">
                <span class="catalog-family">{{ family.title }}</span>
                <CmIcon
                  v-for="variant in showcaseVariants"
                  :key="variant"
                  :icon="icons.download"
                  :family="family.id"
                  :variant="variant"
                  :size="28"
                  :label="`${family.title} ${variant}`"
                />
              </template>
            </CmGrid>
          </CmStack>
          <CmStack class="showcase-variant" data-icon-sizes>
            <h3 class="showcase-variant-title">Size</h3>
            <CmInline class="catalog-sizes">
              <CmStack v-for="size in sizes" :key="size">
                <CmIcon :icon="icons.star" :size="size" />
                <span>{{ size }} px</span>
              </CmStack>
            </CmInline>
          </CmStack>
          <CmStack class="showcase-variant" data-icon-uses>
            <h3 class="showcase-variant-title">Use</h3>
            <CmInline>
              <CmLink class="catalog-context-link" :href="staticPreview ? './layouts/' : '/layouts/'" underline="hover">
                <CmIcon :icon="icons.grid" />Layouts
              </CmLink>
              <CmBadge tone="success"><CmIcon :icon="icons.checkCircle" />Deployed</CmBadge>
              <CmBadge tone="info"><CmIcon :icon="icons.circleNotch" spin />Loading</CmBadge>
            </CmInline>
          </CmStack>
        </CmGrid>
      </CmStack>
    </CmPanel>

    <div class="catalog-toolbar">
      <CmField v-slot="{ controlId }" class="catalog-search" control-id="icon-catalog-search" label="Search icons">
        <CmInput :id="controlId" v-model="query" type="search" clearable />
      </CmField>
      <p>Click an icon to copy its name.</p>
      <CmLink
        class="catalog-brands-link"
        :href="staticPreview ? './icons/#brand-icons-heading' : '#brand-icons-heading'"
      >
        Brands
      </CmLink>
      <p class="catalog-results" aria-live="polite">
        <span data-icon-count :data-total="iconNames.length">{{ iconCountLabel(resultCount, iconNames.length) }}</span>
        <span data-icon-copy-status>{{ copyStatus ? ` · ${copyStatus}` : '' }}</span>
      </p>
    </div>

    <CmPanel
      v-for="{ id, label, empty, names } in filteredGroups"
      :key="id"
      class="showcase-group"
      :aria-labelledby="id"
      data-icon-group
    >
      <h2 :id="id" class="showcase-component-title">{{ label }}</h2>
      <CmGrid class="catalog-icons">
        <CmButton
          v-for="name in names"
          :key="name"
          class="catalog-icon"
          variant="ghost"
          size="sm"
          :data-icon-name="name"
          :data-icon-search="searchableText.get(name)"
          :aria-label="`Copy ${name}`"
          data-copy-icon
          @click="copyIconName(name)"
        >
          <template #leading>
            <CmIcon
              :icon="icons[name]"
              :variant="iconCatalog[name].variants.includes('regular') ? 'regular' : 'solid'"
            />
          </template>
          {{ name }}
        </CmButton>
      </CmGrid>
      <p data-icon-empty :hidden="names.length > 0" class="catalog-empty">{{ empty }}</p>
    </CmPanel>
  </section>
</template>

<style src="../../shared/showcase-icon-gallery.css"></style>
