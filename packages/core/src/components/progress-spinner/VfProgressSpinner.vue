<script setup lang="ts">
import { computed } from 'vue';
import { resolveProgressSpinnerClasses, resolveProgressSpinnerStyle } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';
import type { VfFeedbackTone } from '@/types/components';

defineOptions({
  name: 'VfProgressSpinner',
});

interface VfProgressSpinnerProps {
  label?: string;
  size?: string | number;
  strokeWidth?: number;
  tone?: VfFeedbackTone;
}

const props = withDefaults(defineProps<VfProgressSpinnerProps>(), {
  label: 'Loading',
  size: undefined,
  strokeWidth: 4,
  tone: 'primary',
});

const classes = computed(() => cx(...resolveProgressSpinnerClasses(props.tone)));
// A plain object handed to Vue's serialisers, as the reference did. An absent
// size gives an empty object, which both serialisers treat exactly as the
// historical `{ '--x': undefined }`; an empty-string size keeps its empty
// declaration, which the client drops and the server writes as `--x:;`.
const rootStyle = computed(() => Object.fromEntries(resolveProgressSpinnerStyle(props.size)));
</script>

<template>
  <span :class="classes" :style="rootStyle" role="progressbar" :aria-label="props.label">
    <svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />
      <circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />
    </svg>
  </span>
</template>
