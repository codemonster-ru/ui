<script setup lang="ts">
import { computed } from 'vue';

import VueIconify from '../icon/VueIconify.vue';
import CmAlert from './CmAlert.vue';
import type { CmAlertTone, VfAlertProps } from './alert.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfAlertProps>(), { tone: 'primary' });
const defaultIcons = new Map<CmAlertTone, string>([
  ['danger', 'xCircle'],
  ['help', 'questionCircle'],
  ['success', 'checkCircle'],
  ['warning', 'alertCircle'],
]);
const tone = computed(() => (props.tone === 'warn' ? 'warning' : props.tone));
const icon = computed(() => props.icon ?? defaultIcons.get(tone.value) ?? 'infoCircle');
</script>

<template>
  <CmAlert v-bind="{ role: 'alert', ...$attrs }" :tone="tone" :title="props.title">
    <template v-if="!props.hideIcon" #icon>
      <slot name="icon"><VueIconify :icon="icon" size="var(--cm-icon-size-lg)" /></slot>
    </template>
    <template v-if="$slots.title" #title><slot name="title" /></template>
    <slot />
  </CmAlert>
</template>
