<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { resolveCardClasses, resolveCardRegions } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfCardProps {
  title?: string;
  compact?: boolean;
}

const props = withDefaults(defineProps<VfCardProps>(), {
  title: undefined,
  compact: false,
});

const attrs = useAttrs();
const slots = useSlots();

const classes = computed(() => cx(...resolveCardClasses(props.compact)));

// Which regions render, stated once so the Razor adapter derives them from the
// same rule rather than re-reading the template. `headerTitle` is not consumed
// here: in Vue the fallback heading is slot fallback content, and the compiler
// already suppresses it when a header slot exists. Razor has no slot-fallback
// mechanism, so it needs that half of the rule spelled out.
const regions = computed(() =>
  resolveCardRegions({
    title: props.title,
    hasHeaderSlot: Boolean(slots.header),
    hasDefaultSlot: Boolean(slots.default),
    hasFooterSlot: Boolean(slots.footer),
  }),
);
</script>

<template>
  <section :class="classes" v-bind="attrs">
    <header v-if="regions.header">
      <slot name="header">
        <h3 class="vf-card__title">{{ props.title }}</h3>
      </slot>
    </header>

    <div v-if="regions.body" class="vf-card__body">
      <slot />
    </div>

    <footer v-if="regions.footer">
      <slot name="footer" />
    </footer>
  </section>
</template>
