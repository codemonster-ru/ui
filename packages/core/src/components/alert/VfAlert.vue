<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { cx } from '@/utils/classes';
import type { IconName } from '@codemonster-ru/vueforge-icons';
import type { VfFeedbackTone } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfAlertProps {
  tone?: VfFeedbackTone;
  title?: string;
  icon?: IconName | string;
  hideIcon?: boolean;
}

const props = withDefaults(defineProps<VfAlertProps>(), {
  tone: 'primary',
  title: undefined,
  icon: undefined,
  hideIcon: false,
});

const attrs = useAttrs();

const classes = computed(() => cx('vf-alert', props.tone !== 'primary' && `vf-alert--${props.tone}`));

const defaultIconName = computed(() => {
  if (props.tone === 'success') {
    return icons.checkCircle;
  }

  if (props.tone === 'info') {
    return icons.infoCircle;
  }

  if (props.tone === 'warn') {
    return icons.alertCircle;
  }

  if (props.tone === 'help') {
    return icons.questionCircle;
  }

  if (props.tone === 'danger') {
    return icons.xCircle;
  }

  if (props.tone === 'contrast') {
    return icons.infoCircle;
  }

  return icons.infoCircle;
});

const iconName = computed(() => props.icon ?? defaultIconName.value);
const showsIcon = computed(() => !props.hideIcon);
</script>

<template>
  <section :class="classes" role="alert" v-bind="attrs">
    <div v-if="showsIcon" class="vf-alert__icon" aria-hidden="true">
      <slot name="icon">
        <VueIconify :icon="iconName" size="var(--vf-icon-size-xl)" />
      </slot>
    </div>

    <div class="vf-alert__content">
      <p v-if="props.title || $slots.title" class="vf-alert__title">
        <slot name="title">
          {{ props.title }}
        </slot>
      </p>

      <div class="vf-alert__body">
        <slot />
      </div>
    </div>
  </section>
</template>
