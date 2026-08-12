<template>
  <CmContainer element="main" size="xl" class="layout-showcase">
    <CmStack>
      <header>
        <CmBadge tone="primary">CodeMonster UI</CmBadge>
        <h1>Layout primitives</h1>
        <p>The shared primitives own spacing and surfaces while the application owns landmarks and shell behavior.</p>
      </header>

      <CmSection surface>
        <CmStack>
          <h2>Container and Stack</h2>
          <p>Container constrains readable width; Stack creates vertical flow between related regions.</p>
          <CmContainer size="md" class="layout-frame">
            <CmStack element="section">
              <CmCard title="First region">Stack uses the shared layout gap.</CmCard>
              <CmCard title="Second region">Consumers choose the semantic element.</CmCard>
            </CmStack>
          </CmContainer>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Inline</h2>
          <CmInline element="nav" aria-label="Example actions">
            <CmButton>Create project</CmButton>
            <CmButton variant="secondary">Import</CmButton>
            <CmButton variant="ghost">Documentation</CmButton>
          </CmInline>
          <CmInline :wrap="false" class="layout-nowrap" aria-label="Non-wrapping statuses">
            <CmBadge v-for="status in statuses" :key="status">{{ status }}</CmBadge>
          </CmInline>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Section surfaces</h2>
          <CmGrid>
            <CmSection element="article">
              <h3>Plain section</h3>
              <p>Semantic grouping without surface treatment.</p>
            </CmSection>
            <CmSection element="article" surface>
              <h3>Surface section</h3>
              <p>Shared border, background, radius, and shadow.</p>
            </CmSection>
          </CmGrid>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Responsive Grid</h2>
          <CmGrid element="ul" class="layout-list">
            <li v-for="project in projects" :key="project.name">
              <CmCard :title="project.name" compact>
                <CmBadge :tone="project.tone">{{ project.status }}</CmBadge>
              </CmCard>
            </li>
          </CmGrid>
        </CmStack>
      </CmSection>

      <CmSection surface>
        <CmStack>
          <h2>Application composition</h2>
          <CmGrid>
            <CmCard title="Navigation">Shell regions remain application-owned.</CmCard>
            <CmCard title="Content">Primitives compose inside any Vue application.</CmCard>
            <CmCard title="Aside">The same DOM contract is available in Razor.</CmCard>
          </CmGrid>
        </CmStack>
      </CmSection>
    </CmStack>
  </CmContainer>
</template>

<script setup lang="ts">
import {
  CmBadge,
  CmButton,
  CmCard,
  CmContainer,
  CmGrid,
  CmInline,
  CmSection,
  CmStack,
  type CmBadgeTone,
} from '@codemonster-ru/ui-vue';

const statuses = ['Ready', 'In review', 'Preview', 'Published'];
const projects: Array<{ name: string; status: string; tone: CmBadgeTone }> = [
  { name: 'Atlas', status: 'Ready', tone: 'success' },
  { name: 'Nova', status: 'Preview', tone: 'info' },
  { name: 'Orbit', status: 'Blocked', tone: 'warning' },
];
</script>

<style scoped>
.layout-showcase { padding-block: 2rem; }
.layout-showcase h1, .layout-showcase h2, .layout-showcase h3 { margin: 0; }
.layout-showcase p { color: var(--cm-color-text-muted); }
.layout-frame { border: 1px dashed var(--cm-color-border-default); padding: 1rem; }
.layout-nowrap { overflow-x: auto; }
.layout-list { margin: 0; padding: 0; list-style: none; }
</style>
