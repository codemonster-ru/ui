<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    fillViewport?: boolean;
  }>(),
  {
    as: 'div',
    fillViewport: true,
  },
);

const attrs = useAttrs();
const slots = useSlots();
const hasAside = computed(() => Boolean(slots.brand) || Boolean(slots.aside));
const hasBrand = computed(() => Boolean(slots.brand));
const hasHeader = computed(() => Boolean(slots.header));
const hasFooter = computed(() => Boolean(slots.footer));
const classes = computed(() =>
  cx(
    'vf-admin-layout',
    props.fillViewport && 'vf-admin-layout--fill-viewport',
    hasAside.value && 'vf-admin-layout--with-aside',
    hasBrand.value && 'vf-admin-layout--with-brand',
    hasBrand.value && Boolean(slots.aside) && 'vf-admin-layout--with-brand-divider',
    hasHeader.value && 'vf-admin-layout--with-header',
  ),
);
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <aside v-if="hasAside" class="vf-admin-layout__aside">
      <div v-if="hasBrand" class="vf-admin-layout__brand">
        <slot name="brand" />
      </div>
      <div v-if="$slots.aside" class="vf-admin-layout__aside-content">
        <slot name="aside" />
      </div>
    </aside>

    <div class="vf-admin-layout__main">
      <header v-if="hasHeader" class="vf-admin-layout__header">
        <slot name="header" />
      </header>

      <main class="vf-admin-layout__content">
        <slot />
      </main>

      <footer v-if="hasFooter" class="vf-admin-layout__footer">
        <slot name="footer" />
      </footer>
    </div>
  </component>
</template>
