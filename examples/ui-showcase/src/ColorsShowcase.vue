<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { checkCircle, copy, info, questionCircle, warning, xCircle } from '@codemonster-ru/ui-icons';
import { CmAlert, CmBadge, CmButton, CmCheckbox, CmIcon, CmIconButton, CmInput, CmTag } from '@codemonster-ru/ui-vue';
import { fillContrastTable } from '../../shared/showcase-reference.js';
import { colorHero, contrastRows, families, semanticSwatches } from '../../shared/showcase-colors.mts';
import '../../shared/showcase-colors.css';

const statusTones = [
  { tone: 'success', label: 'success', icon: checkCircle },
  { tone: 'info', label: 'info', icon: info },
  { tone: 'warning', label: 'warning', icon: warning },
  { tone: 'danger', label: 'danger', icon: xCircle },
  { tone: 'help', label: 'help', icon: questionCircle },
] as const;
const actionVariants = ['primary', 'secondary', 'danger', 'ghost'] as const;

const modes = ['light', 'dark'] as const;
const table = ref<HTMLElement | null>(null);
onMounted(() => {
  if (table.value) fillContrastTable(table.value);
});

const copyStatus = ref<Record<string, string>>({});
async function copySample(mode: string, event: MouseEvent) {
  const sample = (event.currentTarget as HTMLElement).closest('figure')?.querySelector('code')?.textContent;
  if (!sample) return;
  try {
    await navigator.clipboard.writeText(sample);
    copyStatus.value[mode] = 'Copied';
  } catch {
    copyStatus.value[mode] = 'Copy unavailable';
  }
}
</script>

<template>
  <div class="color-system">
    <header class="color-system__hero">
      <p class="color-system__eyebrow">{{ colorHero.eyebrow }}</p>
      <h1>{{ colorHero.title }}</h1>
      <p>{{ colorHero.description }}</p>
    </header>

    <section class="color-system__section" aria-labelledby="primitive-scales">
      <div class="color-system__section-heading">
        <h2 id="primitive-scales">Primitive scales</h2>
        <p>Every displayed step has a concrete semantic use in light, dark, or interaction states.</p>
      </div>

      <div class="color-system__families">
        <article v-for="[family, steps] in families" :key="family" class="color-system__family">
          <h3>{{ family }}</h3>
          <div class="color-system__scale">
            <div v-for="{ variable, step } in steps" :key="step" class="color-system__primitive">
              <span
                class="color-system__primitive-color"
                :style="{ background: `var(${variable})` }"
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
        <article v-for="mode in modes" :key="mode" class="color-system__theme" :data-cm-theme="mode">
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
              <CmInput model-value="Invalid value" invalid aria-label="Invalid color state" />
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
              <template #icon><CmIcon :icon="status.icon" /></template>
              Separate background, border, icon, and foreground roles.
            </CmAlert>
            <div class="color-system__chips">
              <CmBadge v-for="status in statusTones" :key="`badge-${status.tone}`" :tone="status.tone">
                {{ status.label }}
              </CmBadge>
              <CmTag v-for="status in statusTones" :key="`tag-${status.tone}`" :tone="status.tone">
                {{ status.label }}
              </CmTag>
            </div>
          </div>

          <figure class="color-system__code">
            <figcaption>
              <span>color-system.ts</span>
              <CmIconButton label="Copy code" size="sm" variant="ghost" @click="copySample(mode, $event)"
                ><CmIcon :icon="copy"
              /></CmIconButton>
            </figcaption>
            <pre
              tabindex="0"
              aria-label="TypeScript color system sample"
            ><code><span class="showcase-code-keyword">type</span> <span class="showcase-code-type">Release</span> = { version: <span class="showcase-code-type">string</span>; stable: <span class="showcase-code-type">boolean</span>; };
<span class="showcase-code-keyword">const</span> release: <span class="showcase-code-type">Release</span> = { version: <span class="showcase-code-string">'2.0.0'</span>, stable: <span class="showcase-code-keyword">true</span> };
<span class="showcase-code-comment">// Semantic colors stay readable in both themes.</span></code></pre>
            <span v-if="copyStatus[mode]" class="color-system__copy-status" role="status">{{ copyStatus[mode] }}</span>
          </figure>

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
        <p>Ratios use the current theme tokens rendered in sRGB.</p>
      </div>

      <div
        ref="table"
        class="color-system__contrast-table-wrap"
        tabindex="0"
        role="region"
        aria-label="Contrast ratios"
      >
        <table class="color-system__contrast-table">
          <thead>
            <tr>
              <th scope="col">Pairing</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[label, foreground, background] in contrastRows" :key="label">
              <th scope="row">{{ label }}</th>
              <td v-for="mode in modes" :key="mode">
                <span
                  :data-cm-theme="mode"
                  :data-contrast-foreground="'--cm-color-' + foreground"
                  :data-contrast-background="'--cm-color-' + background"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
