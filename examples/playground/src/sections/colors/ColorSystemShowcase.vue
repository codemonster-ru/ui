<script setup lang="ts">
import { VfTag, vfSemanticColorTokenNames } from '@codemonster-ru/vueforge-core';
import { CmAlert, CmBadge, CmButton, CmCheckbox, CmInput } from '@codemonster-ru/ui-vue';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import { CmSection, CmStack } from '@codemonster-ru/ui-vue';
import './color-system-showcase.css';

interface PrimitiveFamily {
  name: string;
  prefix: string;
  steps: readonly number[];
}

const primitiveFamilies: PrimitiveFamily[] = [
  {
    name: 'Neutral',
    prefix: 'neutral',
    steps: [0, 50, 100, 200, 250, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950, 1000],
  },
  { name: 'Primary', prefix: 'primary', steps: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Success', prefix: 'success', steps: [100, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Info', prefix: 'info', steps: [100, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Warning', prefix: 'warning', steps: [100, 300, 400, 500, 600, 700, 800, 900, 950] },
  { name: 'Danger', prefix: 'danger', steps: [100, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Help', prefix: 'help', steps: [100, 300, 400, 500, 600, 700, 800, 900] },
];

const statusTones = [
  { tone: 'success', legacyTone: 'success', label: 'success' },
  { tone: 'info', legacyTone: 'info', label: 'info' },
  { tone: 'warning', legacyTone: 'warn', label: 'warning' },
  { tone: 'danger', legacyTone: 'danger', label: 'danger' },
  { tone: 'help', legacyTone: 'help', label: 'help' },
] as const;
const actionVariants = ['primary', 'secondary', 'danger', 'ghost'] as const;

const contrastRows = [
  { label: 'Primary text / surface', light: '15.50', dark: '11.67' },
  { label: 'Muted text / canvas', light: '4.55', dark: '5.43' },
  { label: 'Interactive border / surface', light: '3.19', dark: '3.24' },
  { label: 'Focus ring / surface', light: '5.89', dark: '7.39' },
  { label: 'Primary solid / foreground', light: '5.89', dark: '4.62' },
  { label: 'Selected strongest state', light: '4.59', dark: '5.35' },
];

const semanticSwatches = vfSemanticColorTokenNames.map((name) => {
  const variable = `--vf-${name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
  const label = name
    .replace(/^color/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());

  return [label, variable] as const;
});

const codeSample = [
  'type Release = { version: string; stable: boolean };',
  "const release: Release = { version: '2.0.0', stable: true };",
  '// Semantic colors stay readable in both themes.',
].join('\n');
</script>

<template>
  <CmSection class="demo-page">
    <CmStack class="demo-container color-system" gap="roomy">
      <header class="color-system__hero">
        <p class="color-system__eyebrow">VueForge color system · Phase 2</p>
        <h1>Perceptual materials, semantic decisions</h1>
        <p>
          Primitive OKLCH scales feed semantic roles. Components consume only the canonical VueForge 2 semantic token
          layer.
        </p>
      </header>

      <section class="color-system__section" aria-labelledby="primitive-scales">
        <div class="color-system__section-heading">
          <h2 id="primitive-scales">Primitive scales</h2>
          <p>Every displayed step has a concrete semantic use in light, dark, or interaction states.</p>
        </div>

        <div class="color-system__families">
          <article v-for="family in primitiveFamilies" :key="family.name" class="color-system__family">
            <h3>{{ family.name }}</h3>
            <div class="color-system__scale">
              <div v-for="step in family.steps" :key="step" class="color-system__primitive">
                <span
                  class="color-system__primitive-color"
                  :style="{ background: `var(--vf-palette-${family.prefix}-${step})` }"
                  aria-hidden="true"
                />
                <span>{{ step }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="color-system__section" aria-labelledby="theme-pairings">
        <div class="color-system__section-heading">
          <h2 id="theme-pairings">Light and dark semantic pairings</h2>
          <p>Both panels use the same roles, but each mode selects materials independently.</p>
        </div>

        <div class="color-system__theme-grid">
          <article
            v-for="mode in ['light', 'dark'] as const"
            :key="mode"
            class="color-system__theme"
            :data-vf-theme="mode"
          >
            <header class="color-system__theme-header">
              <h3>{{ mode }}</h3>
              <span>scoped theme</span>
            </header>

            <div class="color-system__semantic-grid">
              <div
                v-for="[label, variable] in semanticSwatches"
                :key="variable"
                class="color-system__semantic"
                :title="variable"
              >
                <span
                  class="color-system__semantic-color"
                  :style="{ background: `var(${variable})` }"
                  aria-hidden="true"
                />
                <span>{{ label }}</span>
              </div>
            </div>

            <div class="color-system__state-row" aria-label="Interactive surface states">
              <span class="color-system__state color-system__state--default">Default</span>
              <span class="color-system__state color-system__state--hover">Hover</span>
              <span class="color-system__state color-system__state--active">Active</span>
              <span class="color-system__state color-system__state--selected">Selected</span>
              <span class="color-system__state color-system__state--selected-hover">Selected + hover</span>
              <span class="color-system__state color-system__state--selected-active">Selected + active</span>
            </div>

            <div class="color-system__controls">
              <CmInput model-value="Semantic boundary" aria-label="Semantic boundary example" />
              <div class="color-system__field-states">
                <CmInput
                  model-value="Invalid value"
                  invalid
                  aria-label="Invalid color state"
                  data-phase2-state="invalid-input"
                />
                <CmInput model-value="Read-only value" readonly aria-label="Read-only color state" />
                <CmInput model-value="Disabled value" disabled aria-label="Disabled color state" />
              </div>
              <CmCheckbox :model-value="true" label="Selected with a non-color cue" />
              <div class="color-system__actions">
                <CmButton v-for="variant in actionVariants" :key="variant" :variant="variant">{{ variant }}</CmButton>
                <CmButton loading>Loading</CmButton>
                <CmButton disabled>Disabled</CmButton>
              </div>
            </div>

            <div class="color-system__statuses">
              <CmAlert
                v-for="status in statusTones"
                :key="status.tone"
                :tone="status.tone"
                :title="`${status.label} status`"
              >
                Separate background, border, icon, and foreground roles.
              </CmAlert>
              <div class="color-system__chips">
                <CmBadge v-for="status in statusTones" :key="`badge-${status.tone}`" :tone="status.tone">
                  {{ status.label }}
                </CmBadge>
                <VfTag v-for="status in statusTones" :key="`tag-${status.tone}`" :tone="status.legacyTone">
                  {{ status.label }}
                </VfTag>
              </div>
            </div>

            <VfCodeBlock :code="codeSample" language="ts" filename="color-system.ts" theme="inherit" />

            <div class="color-system__overlay-sample">
              <div class="color-system__overlay-card">
                <strong>Elevated surface</strong>
                <span>Backdrop, elevation, border, and text roles resolve inside the same scoped theme.</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="color-system__section" aria-labelledby="contrast-matrix">
        <div class="color-system__section-heading">
          <h2 id="contrast-matrix">Supported contrast matrix</h2>
          <p>CI validates the supported pairings rather than a meaningless Cartesian product.</p>
        </div>

        <div class="color-system__contrast-table-wrap">
          <table class="color-system__contrast-table">
            <thead>
              <tr>
                <th scope="col">Pairing</th>
                <th scope="col">Light</th>
                <th scope="col">Dark</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in contrastRows" :key="row.label">
                <th scope="row">{{ row.label }}</th>
                <td>{{ row.light }}:1</td>
                <td>{{ row.dark }}:1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </CmStack>
  </CmSection>
</template>
