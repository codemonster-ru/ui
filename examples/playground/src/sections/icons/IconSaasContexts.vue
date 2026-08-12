<template>
  <div class="icon-saas-contexts">
    <article
      v-for="variant in variants"
      :key="variant.id"
      :data-vf-theme="variant.theme"
      :class="['icon-saas-context', `icon-saas-context--${variant.density}`]"
    >
      <header class="icon-saas-context__label">
        <strong>{{ variant.theme }}</strong>
        <span>{{ variant.density }} density</span>
      </header>

      <CmSection class="icon-saas-context__viewport" surface>
        <CmStack>
          <CmInline class="icon-saas-toolbar" :wrap="false">
            <CmInline class="icon-saas-brand" :wrap="false">
              <VueIconify icon="grid" :size="18" />
              <strong>CodeMonster UI</strong>
            </CmInline>
            <CmInput
              class="icon-saas-search"
              :size="variant.density === 'compact' ? 'sm' : 'md'"
              placeholder="Search projects"
              readonly
              aria-label="Search projects"
            />
            <CmButton :size="variant.density === 'compact' ? 'sm' : 'md'" variant="secondary">
              <VueIconify icon="plus" :size="16" />
              New project
            </CmButton>
          </CmInline>

          <CmInline class="icon-saas-title" :wrap="false">
            <div>
              <small>Workspace</small>
              <h3>Operations overview</h3>
            </div>
            <CmButton size="sm" variant="ghost" aria-label="Download report">
              <VueIconify icon="download" :size="16" />
            </CmButton>
          </CmInline>

          <CmGrid class="icon-saas-metrics">
            <CmCard v-for="metric in metrics" :key="metric.label" :compact="variant.density === 'compact'">
              <CmInline class="icon-saas-metric" :wrap="false">
                <VueIconify :icon="metric.icon" :size="19" />
                <span>{{ metric.label }}<strong>{{ metric.value }}</strong></span>
              </CmInline>
            </CmCard>
          </CmGrid>

          <CmGrid class="icon-saas-feedback">
            <CmAlert tone="warning" title="Backup">
              <CmInline :wrap="false"><VueIconify icon="warning" :size="18" /> Requires attention.</CmInline>
            </CmAlert>
            <CmAlert tone="info" title="Updates">
              <CmInline :wrap="false"><VueIconify icon="infoCircle" :size="18" /> Three updates are ready.</CmInline>
            </CmAlert>
          </CmGrid>

          <CmGrid class="icon-saas-projects">
            <CmCard v-for="project in projects" :key="project.name" :title="project.name" compact>
              <CmStack>
                <CmInline :wrap="false">
                  <VueIconify :icon="project.icon" :size="18" />
                  <span>{{ project.owner }}</span>
                </CmInline>
                <CmBadge tone="success">Healthy</CmBadge>
              </CmStack>
            </CmCard>
          </CmGrid>

          <CmSection class="icon-saas-empty" surface>
            <CmInline :wrap="false">
              <VueIconify icon="message" :size="24" />
              <span><strong>No pending messages</strong><small>New activity will appear here.</small></span>
              <CmButton class="icon-saas-upload" size="sm" variant="ghost" aria-label="Upload a message">
                <VueIconify icon="upload" :size="16" />
              </CmButton>
            </CmInline>
          </CmSection>
        </CmStack>
      </CmSection>
    </article>
  </div>
</template>

<script setup lang="ts">
import { CmAlert, CmBadge, CmButton, CmCard, CmGrid, CmInline, CmInput, CmSection, CmStack } from '@codemonster-ru/ui-vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';

const variants = [
  { id: 'light-normal', theme: 'light', density: 'normal' },
  { id: 'dark-normal', theme: 'dark', density: 'normal' },
  { id: 'light-compact', theme: 'light', density: 'compact' },
  { id: 'dark-compact', theme: 'dark', density: 'compact' },
] as const;
const metrics: Array<{ label: string; value: string; icon: IconName }> = [
  { label: 'Active users', value: '12,480', icon: 'users' },
  { label: 'Storage', value: '68%', icon: 'database' },
  { label: 'Uptime', value: '99.98%', icon: 'cloud' },
];
const projects: Array<{ name: string; owner: string; icon: IconName }> = [
  { name: 'Atlas migration', owner: 'M. Chen', icon: 'file' },
  { name: 'Lifecycle email', owner: 'S. Rivera', icon: 'mail' },
];
</script>

<style scoped>
.icon-saas-contexts { display: grid; gap: 1.5rem; }
.icon-saas-context { overflow: hidden; border: 1px solid var(--cm-color-border-default); border-radius: var(--cm-radius-surface); }
.icon-saas-context__label, .icon-saas-toolbar, .icon-saas-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.icon-saas-context__label { padding: 0.75rem 1rem; text-transform: capitalize; }
.icon-saas-context__label span, .icon-saas-title small { color: var(--cm-color-text-muted); }
.icon-saas-context__viewport { border: 0; border-radius: 0; }
.icon-saas-brand, .icon-saas-metric { align-items: center; }
.icon-saas-search { width: min(22rem, 45%); }
.icon-saas-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.icon-saas-feedback, .icon-saas-projects { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.icon-saas-metric span, .icon-saas-empty span { display: grid; }
.icon-saas-metric span { color: var(--cm-color-text-muted); }
.icon-saas-metric strong { color: var(--cm-color-text-default); }
.icon-saas-upload { margin-inline-start: auto; }
.icon-saas-context--compact .icon-saas-context__viewport { padding: 0.75rem; }
@container (max-width: 760px) { .icon-saas-metrics, .icon-saas-feedback, .icon-saas-projects { grid-template-columns: 1fr; } }
</style>
