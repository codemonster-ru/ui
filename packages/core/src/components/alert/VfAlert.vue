<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { VueIconify } from '@codemonster-ru/vueforge-icons';
import { resolveAlertClasses, resolveAlertIcon, resolveAlertRegions } from '@codemonster-ru/vueforge-shared-core';
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
const slots = useSlots();

const classes = computed(() => cx(...resolveAlertClasses(props.tone)));

// The tone-to-glyph chain the reference wrote, stated once so the Razor adapter
// renders the same registry name. The names are the ones the icons package's
// `icons` map produces - `icons.checkCircle` is 'check-circle' - so the rule
// carries the strings rather than reading the map, and no longer needs it.
const iconName = computed(() => resolveAlertIcon({ tone: props.tone, icon: props.icon }));

// Which optional parts render. `iconGlyph` and `titleText` are not consumed
// here: in Vue both fallbacks are slot fallback content, and the compiler
// already suppresses them when the slot renders something. Razor has no
// slot-fallback mechanism, so it needs those halves of the rule spelled out.
//
// There is no `dismiss` here, and that is a measurement rather than an
// omission: the reference has no such prop, no such button and no such event.
const regions = computed(() =>
  resolveAlertRegions({
    hideIcon: props.hideIcon,
    hasIconSlot: Boolean(slots.icon),
    title: props.title,
    hasTitleSlot: Boolean(slots.title),
  }),
);
</script>

<template>
  <section :class="classes" role="alert" v-bind="attrs">
    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">
      <slot name="icon">
        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />
      </slot>
    </div>

    <div class="vf-alert__content">
      <p v-if="regions.title" class="vf-alert__title">
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
