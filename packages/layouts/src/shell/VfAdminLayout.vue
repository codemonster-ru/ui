<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, watchEffect } from 'vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    fillViewport?: boolean;
    sidebarCollapsed?: boolean;
    defaultSidebarCollapsed?: boolean;
  }>(),
  {
    as: 'div',
    fillViewport: true,
    sidebarCollapsed: undefined,
    defaultSidebarCollapsed: false,
  },
);

const emit = defineEmits<{
  'update:sidebarCollapsed': [value: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();
const uncontrolledSidebarCollapsed = ref(props.defaultSidebarCollapsed);

watchEffect(() => {
  if (props.sidebarCollapsed !== undefined) {
    uncontrolledSidebarCollapsed.value = props.sidebarCollapsed;
  }
});

const isSidebarCollapsed = computed(() =>
  props.sidebarCollapsed === undefined ? uncontrolledSidebarCollapsed.value : props.sidebarCollapsed,
);

function setSidebarCollapsed(value: boolean) {
  if (value === isSidebarCollapsed.value) return;

  if (props.sidebarCollapsed === undefined) {
    uncontrolledSidebarCollapsed.value = value;
  }

  emit('update:sidebarCollapsed', value);
}

function collapseSidebar() {
  setSidebarCollapsed(true);
}

function expandSidebar() {
  setSidebarCollapsed(false);
}

function toggleSidebarCollapsed() {
  setSidebarCollapsed(!isSidebarCollapsed.value);
}

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
    hasAside.value && isSidebarCollapsed.value && 'vf-admin-layout--sidebar-collapsed',
  ),
);

defineExpose({
  collapseSidebar,
  expandSidebar,
  toggleSidebarCollapsed,
});
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <aside v-if="hasAside" class="vf-admin-layout__aside">
      <div v-if="hasBrand" class="vf-admin-layout__brand">
        <slot
          name="brand"
          :is-sidebar-collapsed="isSidebarCollapsed"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
        />
      </div>
      <div v-if="$slots.aside" class="vf-admin-layout__aside-content">
        <slot
          name="aside"
          :is-sidebar-collapsed="isSidebarCollapsed"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
        />
      </div>
    </aside>

    <div class="vf-admin-layout__main">
      <header v-if="hasHeader" class="vf-admin-layout__header">
        <slot
          name="header"
          :is-sidebar-collapsed="isSidebarCollapsed"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
        />
      </header>

      <main class="vf-admin-layout__content">
        <slot
          :is-sidebar-collapsed="isSidebarCollapsed"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
        />
      </main>

      <footer v-if="hasFooter" class="vf-admin-layout__footer">
        <slot name="footer" />
      </footer>
    </div>
  </component>
</template>
