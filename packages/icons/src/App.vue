<template>
  <main class="showcase demo-page">
    <div class="showcase__container demo-container">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Complete system family</p>
          <h2>Classic and duotone variants</h2>
        </div>
        <p>Compare every system icon at 32 px across all supported weights.</p>
      </header>

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
                <div v-for="iconName in systemIconNames" :key="iconName" class="variant-row">
                  <strong>{{ iconName }}</strong>
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
              </div>
            </section>
          </template>
        </template>
      </VfTabs>
    </div>
  </main>
</template>

<script setup lang="ts">
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
const systemIconNames = iconNames.filter(
  (iconName) => !iconCatalog[iconName].brand && iconCatalog[iconName].variants.includes('solid'),
);
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

  .variant-table {
    overflow-x: auto;
  }

  .variant-row {
    min-width: 560px;
  }
}
</style>
