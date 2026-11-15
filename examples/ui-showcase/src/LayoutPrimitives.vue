<script setup lang="ts">
import { computed } from 'vue';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';
import { CmBadge, CmCard, CmContainer, CmGrid, CmInline, CmSection, CmStack } from '@codemonster-ru/ui-vue';

const props = defineProps<{ viewport: number }>();
const breakpoint = computed(
  () =>
    Object.entries(cmBreakpoints)
      .reverse()
      .find(([, width]) => width <= props.viewport)?.[0] ?? 'Below xs',
);
const responsiveValue = computed(() => {
  const name = breakpoint.value;
  if (name === '2xl') return 'xl layout';
  return ['sm', 'md', 'lg', 'xl'].includes(name) ? name + ' layout' : 'base layout';
});
const stacks = [
  ['Vertical composition', 'Item', 'Item'],
  ['Article block', 'Body section', 'Related notes'],
];
const grids = [
  ['Responsive card grid', 'Item', 'Item', 'Item'],
  ['Use grid for summaries', 'Examples', 'Listings'],
];
</script>

<template>
  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-container">
    <header>
      <h2 id="demo-container">CmContainer</h2>
      <p>Constrains content width and supplies the standard responsive page gutter.</p>
    </header>
    <CmSection surface>
      <CmContainer>Use container as the default content boundary inside a full-width section.</CmContainer>
    </CmSection>
  </section>

  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-stack">
    <header>
      <h2 id="demo-stack">CmStack</h2>
      <p>Arranges related items vertically with a consistent, configurable gap.</p>
    </header>
    <div class="layout-sample-pair">
      <CmSection v-for="(items, index) in stacks" :key="items[0]" surface>
        <CmStack :as="index === 1 ? 'article' : 'div'">
          <CmSection v-for="(item, itemIndex) in items" :key="itemIndex" surface>{{ item }}</CmSection>
        </CmStack>
      </CmSection>
    </div>
  </section>

  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-inline">
    <header>
      <h2 id="demo-inline">CmInline</h2>
      <p>Arranges compact items horizontally and optionally wraps them onto new rows.</p>
    </header>
    <div class="layout-sample-pair">
      <CmSection surface>
        <CmInline>
          <CmBadge>Default</CmBadge><CmBadge>Wrapped</CmBadge><CmBadge>Inline</CmBadge><CmBadge>Row</CmBadge>
        </CmInline>
      </CmSection>
      <CmSection surface>
        <CmInline :wrap="false"
          ><CmBadge>No wrap</CmBadge><CmBadge>Actions</CmBadge><CmBadge>Actions</CmBadge></CmInline
        >
      </CmSection>
    </div>
  </section>

  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-section">
    <header>
      <h2 id="demo-section">CmSection</h2>
      <p>Creates a semantic content region with optional surface treatment and inset.</p>
    </header>
    <div class="layout-sample-pair">
      <CmSection><strong>surface: false</strong></CmSection>
      <CmSection surface><strong>surface: true</strong></CmSection>
    </div>
  </section>

  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-grid">
    <header>
      <h2 id="demo-grid">CmGrid</h2>
      <p>Builds a responsive auto-fitting grid for cards, summaries, and listings.</p>
    </header>
    <CmStack>
      <CmSection v-for="items in grids" :key="items[0]" surface>
        <CmGrid
          ><CmCard v-for="(item, index) in items" :key="index">{{ item }}</CmCard></CmGrid
        >
      </CmSection>
    </CmStack>
  </section>

  <section class="showcase-group layout-guide-entry" aria-labelledby="demo-foundation">
    <header>
      <h2 id="demo-foundation">Responsive foundation</h2>
      <p>Inspect shared breakpoints and values that react to the current viewport.</p>
    </header>
    <div class="layout-sample-pair">
      <CmSection surface>
        <CmStack>
          <strong>Breakpoint values</strong>
          <CmStack as="dl" class="layout-breakpoints">
            <div v-for="(width, name) in cmBreakpoints" :key="name" class="layout-breakpoint-entry">
              <dt>{{ name }}</dt>
              <dd>{{ width }}px</dd>
            </div>
          </CmStack>
        </CmStack>
      </CmSection>
      <CmSection surface>
        <CmStack>
          <strong>Runtime state</strong>
          <div class="layout-breakpoint-entry">
            <span>current</span><output>{{ breakpoint }}</output>
          </div>
          <strong>Responsive value</strong>
          <CmCard
            ><output>{{ responsiveValue }}</output></CmCard
          >
        </CmStack>
      </CmSection>
    </div>
  </section>
</template>
