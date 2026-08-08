<template>
  <main class="showcase demo-page">
    <div class="showcase__container demo-container">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Complete icon catalog</p>
          <h2>System and brand icons</h2>
        </div>
        <p>Find an icon, compare every system weight at 32 px, and copy its typed catalog name.</p>
      </header>

      <div class="catalog-toolbar">
        <label class="catalog-search">
          <span>Find an icon</span>
          <input v-model="query" type="search" placeholder="Search by name or keyword" />
        </label>
        <p aria-live="polite">
          {{ filteredSystemIconNames.length + filteredBrandIconNames.length }} of {{ iconNames.length }} icons
          <span v-if="copyStatus">· {{ copyStatus }}</span>
        </p>
      </div>

      <VfTabs class="family-tabs" :items="familyTabs" default-value="classic">
        <template #panel="{ activeValue }">
          <template v-for="iconFamily in showcaseFamilies" :key="iconFamily.id">
            <section v-if="iconFamily.id === activeValue" class="family-section">
              <header class="family-heading">
                <h3>{{ iconFamily.title }}</h3>
                <p>{{ iconFamily.description }}</p>
              </header>

              <div class="variant-table">
                <div class="variant-row variant-row--head">
                  <strong>Icon</strong>
                  <strong v-for="variant in showcaseVariants" :key="variant">{{ variant }}</strong>
                </div>
                <div v-for="iconName in filteredSystemIconNames" :key="iconName" class="variant-row">
                  <div class="icon-identity">
                    <strong>{{ iconName }}</strong>
                    <button type="button" :aria-label="`Copy ${iconName} icon name`" @click="copyIconName(iconName)">
                      Copy
                    </button>
                  </div>
                  <span v-for="variant in showcaseVariants" :key="variant">
                    <VueIconify
                      :icon="iconName"
                      :family="iconFamily.id"
                      :variant="variant"
                      :secondary-color="iconFamily.secondaryColor"
                      :secondary-opacity="iconFamily.secondaryOpacity"
                      :size="32"
                    />
                  </span>
                </div>
                <p v-if="filteredSystemIconNames.length === 0" class="catalog-empty">No system icons match.</p>
              </div>
            </section>
          </template>
        </template>
      </VfTabs>

      <section class="brand-section" aria-labelledby="brand-icons-heading">
        <header class="family-heading">
          <h3 id="brand-icons-heading">Brands</h3>
          <p>Trademark assets use their approved single-color shape and the solid variant.</p>
        </header>
        <div v-if="filteredBrandIconNames.length" class="brand-grid">
          <article v-for="iconName in filteredBrandIconNames" :key="iconName" class="brand-card">
            <VueIconify :icon="iconName" variant="solid" :size="32" />
            <strong>{{ iconName }}</strong>
            <button type="button" :aria-label="`Copy ${iconName} icon name`" @click="copyIconName(iconName)">
              Copy
            </button>
          </article>
        </div>
        <p v-else class="catalog-empty">No brand icons match.</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { VfTabs } from '@codemonster-ru/vueforge-core/tabs';
import VueIconify from './lib/components/icon.vue';
import type { IconFamily } from './lib/iconFamilies';
import { iconCatalog, iconNames } from './lib/iconMeta';
import type { IconVariant } from './lib/iconVariants';

const showcaseVariants = ['solid', 'regular', 'light', 'thin'] as const satisfies readonly IconVariant[];
const showcaseFamilies = [
  {
    id: 'classic',
    title: 'Classic',
    description: 'Original single-color family.',
    secondaryColor: undefined,
    secondaryOpacity: undefined,
  },
  {
    id: 'duotone',
    title: 'Duotone',
    description: 'Two-color Solid; outline weights match Classic.',
    secondaryColor: 'currentColor',
    secondaryOpacity: 0.4,
  },
] as const satisfies ReadonlyArray<{
  id: IconFamily;
  title: string;
  description: string;
  secondaryColor: string | undefined;
  secondaryOpacity: number | undefined;
}>;
const familyTabs = showcaseFamilies.map(({ id, title }) => ({ value: id, label: title }));
const query = ref('');
const copiedIconName = ref('');
const copyFailed = ref(false);
const systemIconNames = iconNames.filter(
  (iconName) => !iconCatalog[iconName].brand && iconCatalog[iconName].variants.includes('solid'),
);
const brandIconNames = iconNames.filter((iconName) => Boolean(iconCatalog[iconName].brand));
const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase());
const matchesQuery = (iconName: (typeof iconNames)[number]) => {
  if (!normalizedQuery.value) return true;

  const entry = iconCatalog[iconName];
  return [iconName, entry.title, ...entry.keywords].join(' ').toLocaleLowerCase().includes(normalizedQuery.value);
};
const filteredSystemIconNames = computed(() => systemIconNames.filter(matchesQuery));
const filteredBrandIconNames = computed(() => brandIconNames.filter(matchesQuery));
const copyStatus = computed(() => {
  if (copyFailed.value) return 'Copy failed';
  return copiedIconName.value ? `Copied ${copiedIconName.value}` : '';
});

async function copyIconName(iconName: (typeof iconNames)[number]) {
  copiedIconName.value = '';
  copyFailed.value = false;

  try {
    await navigator.clipboard.writeText(iconName);
    copiedIconName.value = iconName;
  } catch {
    copyFailed.value = true;
  }
}
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

.showcase {
  --showcase-surface: var(--vf-color-background-surface, #fff);
  --showcase-text: var(--vf-color-text-primary, #18202d);
  --showcase-muted: var(--vf-color-text-muted, #687386);
  --showcase-border: var(--vf-color-border-default, #d9dee7);
  --showcase-divider: var(--vf-color-border-divider, var(--showcase-border));
  --showcase-accent: var(--vf-color-interactive-primary-background, #5b5bd6);
  --showcase-radius: var(--vf-layout-section-radius, 12px);
  --showcase-space: var(--vf-layout-space-layout-base, 16px);

  min-height: 100%;
  padding-block: var(--showcase-space);
  color: var(--showcase-text);
  font-family: var(--vf-font-family-base, Inter, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--vf-text-body-font-size, 14px);
  line-height: var(--vf-text-body-line-height, 1.45);
}

.showcase__container {
  width: 100%;
  max-width: var(--vf-breakpoint-2xl, 1536px);
  margin-inline: auto;
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

.page-heading p,
.family-heading p {
  max-width: 520px;
  margin: 0;
  color: var(--showcase-muted);
  text-align: right;
}

.eyebrow {
  margin: 0;
  color: var(--showcase-accent);
  font-size: var(--vf-text-caption-font-size, 11px);
  font-weight: var(--vf-text-caption-font-weight, 700);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2,
h3 {
  margin: 0;
  font-family: var(--vf-font-family-heading, inherit);
}

h2 {
  font-size: var(--vf-heading-h-3-font-size, 24px);
  font-weight: var(--vf-heading-font-weight, 700);
  line-height: var(--vf-heading-h-3-line-height, 1.2);
}

.family-tabs {
  --vf-tabs-panel-padding-top: calc(var(--showcase-space) * 1.5);
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
  font-size: var(--vf-text-caption-font-size, 11px);
  font-weight: var(--vf-text-caption-font-weight, 700);
}

.catalog-search input {
  min-height: var(--vf-control-height-md, 40px);
  padding: var(--vf-field-padding-md, 8px 12px);
  border: var(--vf-border-width, 1px) solid var(--vf-color-border-interactive, var(--showcase-border));
  border-radius: var(--vf-radius-control, 8px);
  color: var(--showcase-text);
  background: var(--showcase-surface);
  font: inherit;
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
  border: var(--vf-layout-border-base, 1px solid var(--showcase-border));
  border-radius: var(--showcase-radius);
  background: var(--vf-layout-surface-base, var(--showcase-surface));
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

.variant-row > :first-child {
  justify-content: start;
  padding-inline: 16px;
  border-left: 0;
}

.icon-identity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.icon-identity button,
.brand-card button {
  padding: 4px 8px;
  border: 1px solid var(--showcase-border);
  border-radius: var(--vf-radius-control, 8px);
  color: var(--showcase-text);
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.catalog-search input:focus-visible,
.icon-identity button:focus-visible,
.brand-card button:focus-visible {
  border-color: var(--vf-color-border-focus, var(--showcase-accent));
  outline: var(--vf-focus-ring-width, 2px) solid var(--vf-color-focus-ring, var(--showcase-accent));
  outline-offset: var(--vf-focus-ring-width, 2px);
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
  border: var(--vf-layout-border-base, 1px solid var(--showcase-border));
  border-radius: var(--showcase-radius);
  background: var(--vf-layout-surface-base, var(--showcase-surface));
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

  .page-heading p,
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
