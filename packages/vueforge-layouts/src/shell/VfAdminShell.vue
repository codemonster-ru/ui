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
const hasBrand = computed(() => Boolean(slots.brand));
const hasHeader = computed(() => Boolean(slots.header));
const hasHeaderActions = computed(() => Boolean(slots['header-actions']));
const hasSidebar = computed(() => Boolean(slots.sidebar));
const hasFooter = computed(() => Boolean(slots.footer));
const classes = computed(() =>
  cx(
    'vf-admin-shell',
    props.fillViewport && 'vf-admin-shell--fill-viewport',
    hasBrand.value && 'vf-admin-shell--with-brand',
    hasSidebar.value && 'vf-admin-shell--with-sidebar',
  ),
);
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <header v-if="hasBrand || hasHeader || hasHeaderActions" class="vf-admin-shell__topbar">
      <div v-if="hasBrand" class="vf-admin-shell__brand">
        <slot name="brand" />
      </div>
      <div v-if="hasHeader" class="vf-admin-shell__header">
        <slot name="header" />
      </div>
      <div v-if="hasHeaderActions" class="vf-admin-shell__header-actions">
        <slot name="header-actions" />
      </div>
    </header>

    <div class="vf-admin-shell__body">
      <aside v-if="hasSidebar" class="vf-admin-shell__sidebar">
        <div class="vf-admin-shell__sidebar-content">
          <slot name="sidebar" />
        </div>
      </aside>

      <div class="vf-admin-shell__workspace">
        <main class="vf-admin-shell__content">
          <slot />
        </main>

        <footer v-if="hasFooter" class="vf-admin-shell__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </component>
</template>
