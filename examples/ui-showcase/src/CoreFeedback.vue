<script setup lang="ts">
import {
  CmAlert,
  CmAvatar,
  CmBadge,
  CmButton,
  CmCard,
  CmIcon,
  CmProgressBar,
  CmProgressSpinner,
  CmSkeleton,
  CmSkeletonGate,
  CmTag,
} from '@codemonster-ru/ui-vue';
import { checkCircle, info, questionCircle, user, warning, xCircle } from '@codemonster-ru/ui-icons';
import { onUnmounted, ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const tones = ['primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'] as const;
const alertIcons = {
  primary: info,
  success: checkCircle,
  info,
  warning,
  help: questionCircle,
  danger: xCircle,
  contrast: info,
};
const sizes = ['sm', 'md', 'lg'] as const;
const avatar = new URL('../../vanilla/avatar.png', import.meta.url).href;
const people = [
  { label: 'Maya Chen', initials: 'MC', role: 'Product design', image: avatar, status: 'Online' },
  { label: 'Jordan Davis', initials: 'JD', role: 'Frontend engineering', image: null, status: 'Online' },
  { label: 'Sam Rivera', initials: 'SR', role: 'Quality assurance', image: null, status: 'Away' },
];
const progress = ref(0);
const panelReady = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;
function startProgress() {
  clearInterval(timer);
  progress.value = 0;
  timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 10);
    if (progress.value === 100) clearInterval(timer);
  }, 150);
}
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <CoreMatrix title="Feedback visual QA matrix" :columns="2">
    <section class="core-matrix-cell core-matrix-wide">
      <h4>Alert · tones</h4>
      <div class="core-matrix-grid core-matrix-grid--two">
        <CmAlert
          v-for="tone in tones"
          :key="tone"
          :tone="tone"
          :title="(tone === 'warning' ? 'warn' : tone) + ' alert'"
        >
          <template #icon><CmIcon :icon="alertIcons[tone]" /></template>
          Consistent icon, border, and content spacing.
        </CmAlert>
        <CmAlert title="without icon">Text-first alert content alignment.</CmAlert>
      </div>
    </section>
    <section class="core-matrix-cell core-matrix-wide">
      <h4>Avatar</h4>
      <div class="core-matrix-grid core-matrix-grid--two">
        <article class="cm-panel showcase-panel core-matrix-cell">
          <div class="core-avatar-panel-header">
            <div>
              <h5>Project team</h5>
              <strong>Reviewers</strong>
            </div>
            <CmBadge tone="success">3 online</CmBadge>
          </div>
          <div v-for="{ label, initials, role, image, status } in people" :key="label" class="core-avatar-person">
            <CmAvatar :label="initials" :image="image" shape="circle" />
            <div>
              <strong>{{ label }}</strong>
              <p>{{ role }}</p>
            </div>
            <span
              class="core-avatar-presence"
              :class="{ 'core-avatar-presence--online': status === 'Online' }"
              :aria-label="status"
              role="img"
            />
          </div>
        </article>
        <article class="cm-panel showcase-panel core-matrix-cell">
          <div class="core-avatar-panel-header">
            <div>
              <h5>Content variants</h5>
              <strong>Flexible fallbacks</strong>
            </div>
          </div>
          <div class="core-theme-controls core-avatar-variants">
            <div><CmAvatar :image="avatar" image-alt="Maya Chen" shape="circle" size="lg" /><small>Image</small></div>
            <div>
              <CmAvatar role="img" aria-label="User" shape="circle" size="lg"><CmIcon :icon="user" /></CmAvatar
              ><small>Icon</small>
            </div>
            <div>
              <CmAvatar role="img" aria-label="Unknown user" shape="circle" size="lg">?</CmAvatar><small>Slot</small>
            </div>
          </div>
          <div class="core-theme-controls core-avatar-variants">
            <CmAvatar
              v-for="size in sizes"
              :key="size"
              label="MC"
              role="img"
              aria-label="Maya Chen"
              :size="size"
              shape="circle"
            />
            <small>sm · md · lg</small>
          </div>
        </article>
      </div>
    </section>
    <div class="core-matrix-cell">
      <h4>Badge</h4>
      <div class="core-theme-controls">
        <CmBadge>neutral</CmBadge><CmBadge v-for="tone in tones" :key="tone" :tone="tone">{{ tone }}</CmBadge>
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Tag</h4>
      <div class="core-theme-controls">
        <CmTag>neutral</CmTag><CmTag v-for="tone in tones" :key="tone" :tone="tone">{{ tone }}</CmTag>
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Progress bar</h4>
      <CmProgressBar label="Import progress" :value="42" />
      <CmProgressBar :height="16" label="Step progress" :value="7" :max="12" show-value />

      <CmProgressBar :height="16" label="Dynamic progress" :value="progress" tone="success" />
      <CmProgressBar :height="16" striped label="Striped progress" :value="64" tone="info" />
      <CmProgressBar :height="16" striped animated label="Animated striped progress" :value="64" tone="info" />
      <CmProgressBar :height="16" striped animated label="Installing module progress" :value="progress" tone="info" />
      <CmProgressBar label="Background sync progress" tone="info" indeterminate />
      <p class="core-matrix-note">Current run: {{ progress }}%</p>
      <CmButton size="sm" variant="secondary" @click="startProgress">Start progress</CmButton>
    </div>
    <div class="core-matrix-cell">
      <h4>Progress spinner</h4>
      <div class="core-theme-controls">
        <CmProgressSpinner label="Loading preview" />
        <CmProgressSpinner label="Loading large preview" size="lg" tone="warning" />
      </div>
    </div>
    <div class="core-matrix-cell">
      <h4>Skeleton · sizes</h4>
      <CmSkeleton min-height="2.5rem" />
      <CmSkeleton min-height="4rem" radius="surface" />
      <CmSkeleton min-height="6rem" :animated="false" />
    </div>
    <div class="core-matrix-cell">
      <h4>Loading and ready panels</h4>
      <CmButton variant="secondary" @click="panelReady = !panelReady">{{
        panelReady ? 'Show loading' : 'Show content'
      }}</CmButton>
      <CmSkeletonGate :ready="panelReady" min-height="6rem" preserve-last-height>
        <CmCard title="Ready panel" class="core-ready-panel">Ready content replaces the skeleton.</CmCard>
      </CmSkeletonGate>
    </div>
  </CoreMatrix>
</template>
