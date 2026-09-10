<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { resolvePanelClasses, resolvePanelRegions } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfPanelProps {
  title?: string;
  subtle?: boolean;
}

const props = withDefaults(defineProps<VfPanelProps>(), {
  title: undefined,
  subtle: false,
});

const attrs = useAttrs();
const slots = useSlots();

const classes = computed(() => cx(...resolvePanelClasses(props.subtle)));

// Which header parts render, stated once so the Razor adapter derives them from
// the same rule rather than re-reading the template. `headerTitle` is not
// consumed here: in Vue the fallback heading is slot fallback content, and the
// compiler already suppresses it when a header slot renders something. Razor
// has no slot-fallback mechanism, so it needs that half of the rule spelled
// out.
//
// There is no `body` and no `footer` here, and that is the point rather than an
// omission: the default slot renders straight into the section with no wrapper
// and no condition, and a panel has no footer at all. Reusing VfCard's resolver
// would hand this component two decisions it has no elements to make.
const regions = computed(() =>
  resolvePanelRegions({
    title: props.title,
    hasHeaderSlot: Boolean(slots.header),
  }),
);
</script>

<template>
  <section :class="classes" v-bind="attrs">
    <header v-if="regions.header">
      <slot name="header">
        <h3 class="vf-panel__title">{{ props.title }}</h3>
      </slot>
    </header>

    <slot />
  </section>
</template>
