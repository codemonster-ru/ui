<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { checkCircle, info, questionCircle, warning, xCircle } from '@codemonster-ru/ui-icons';
import {
  CmAlert,
  CmBadge,
  CmButton,
  CmGrid,
  CmIcon,
  CmInline,
  CmInput,
  CmPanel,
  CmStack,
  CmTable,
} from '@codemonster-ru/ui-vue';
import { fillContrastTable } from '../../shared/showcase-reference.js';
import { contrastRows, families, selectedSamples, surfaceSamples } from '../../shared/showcase-colors.mts';
import '../../shared/showcase-colors.css';
import { vScrollableTable } from './scrollable-table';

const statusTones = [
  { tone: 'success', label: 'Success', icon: checkCircle },
  { tone: 'info', label: 'Info', icon: info },
  { tone: 'warning', label: 'Warning', icon: warning },
  { tone: 'danger', label: 'Danger', icon: xCircle },
  { tone: 'help', label: 'Help', icon: questionCircle },
] as const;

const modes = ['light', 'dark'] as const;
const table = ref<InstanceType<typeof CmPanel> | null>(null);
onMounted(() => {
  const element: unknown = table.value?.$el;
  if (element instanceof HTMLElement) fillContrastTable(element);
});
</script>

<template>
  <section class="color-system" aria-label="Colors">
    <CmPanel class="showcase-group" aria-labelledby="primitive-scales">
      <h2 id="primitive-scales" class="showcase-component-title">Palette</h2>

      <CmStack class="color-system__families">
        <CmStack v-for="[family, steps] in families" :key="family" class="color-system__family">
          <h3 class="showcase-variant-title">{{ family }}</h3>
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
        </CmStack>
      </CmStack>
    </CmPanel>

    <CmPanel class="showcase-group" aria-labelledby="theme-pairings">
      <h2 id="theme-pairings" class="showcase-component-title">Themes</h2>
      <CmGrid class="color-system__theme-grid">
        <CmStack v-for="mode in modes" :key="mode" class="color-system__theme" :data-cm-theme="mode">
          <h3 class="showcase-variant-title">{{ mode }}</h3>

          <CmGrid class="color-system__samples">
            <CmPanel
              v-for="{ label, background, foreground } in surfaceSamples"
              :key="background"
              class="color-system__sample"
              :style="{ backgroundColor: `var(--cm-color-${background})`, color: `var(--cm-color-${foreground})` }"
              >{{ label }}</CmPanel
            >
          </CmGrid>

          <CmInline role="group" aria-label="Selection states">
            <CmBadge
              v-for="{ label, background } in selectedSamples"
              :key="background"
              class="color-system__selected"
              :style="{ backgroundColor: `var(--cm-color-${background})` }"
              >{{ label }}</CmBadge
            >
          </CmInline>

          <CmInline>
            <CmButton>Primary</CmButton>
            <CmButton variant="secondary">Secondary</CmButton>
          </CmInline>

          <CmGrid class="color-system__samples">
            <CmInput model-value="Default" :aria-label="`${mode} default field`" />
            <CmInput model-value="Invalid" invalid :aria-label="`${mode} invalid field`" />
            <CmInput model-value="Disabled" disabled :aria-label="`${mode} disabled field`" />
          </CmGrid>

          <CmGrid class="color-system__statuses">
            <CmAlert v-for="{ tone, label, icon } in statusTones" :key="tone" :tone="tone">
              <template #icon><CmIcon :icon="icon" /></template>
              {{ label }}
            </CmAlert>
          </CmGrid>

          <CmPanel class="color-system__backdrop">
            <CmPanel class="color-system__elevated">Elevated</CmPanel>
          </CmPanel>

          <pre
            class="color-system__syntax"
            tabindex="0"
            :aria-label="`${mode} syntax colors`"
          ><code><span class="color-system__keyword">const</span> theme: <span class="color-system__type">string</span> = <span class="color-system__string">'{{ mode }}'</span>;
<span class="color-system__comment">// Theme preview</span></code></pre>
        </CmStack>
      </CmGrid>
    </CmPanel>

    <CmPanel ref="table" class="showcase-group" aria-labelledby="contrast-matrix">
      <h2 id="contrast-matrix" class="showcase-component-title">Contrast</h2>

      <CmTable v-scrollable-table="'Contrast ratios'" density="compact">
        <template #header>
          <tr>
            <th scope="col">Pairing</th>
            <th scope="col">Light</th>
            <th scope="col">Dark</th>
          </tr>
        </template>
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
      </CmTable>
    </CmPanel>
  </section>
</template>
