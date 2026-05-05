<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  type VNode,
  computed,
  ref,
  type StyleValue,
  useAttrs,
  useSlots,
  watchEffect,
} from 'vue';
import { vfBreakpoints } from '@codemonster-ru/vueforge-core/foundation';
import { useCssVarBreakpointMatch } from '../composables/useCssVarBreakpointMatch';
import { useObservedElementHeight } from '../composables/useObservedElementHeight';
import { cx } from '../utils/classes';
import VfContainer from '../primitives/VfContainer.vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside';
    fillViewport?: boolean;
    showSubheader?: boolean;
    showContentSubheader?: boolean;
    stickyHeader?: boolean;
    stickySidebar?: boolean;
    stickyAside?: boolean;
    sidebarAppearance?: 'default' | 'plain';
    asideAppearance?: 'default' | 'plain';
    contentAppearance?: 'default' | 'plain';
    contentPadded?: boolean;
    sidebarCollapsed?: boolean;
    defaultSidebarCollapsed?: boolean;
  }>(),
  {
    as: 'div',
    layout: 'sidebar-content-aside',
    fillViewport: false,
    showSubheader: true,
    showContentSubheader: true,
    stickyHeader: undefined,
    stickySidebar: false,
    stickyAside: false,
    sidebarAppearance: 'default',
    asideAppearance: 'default',
    contentAppearance: 'default',
    contentPadded: true,
    defaultSidebarCollapsed: false,
  },
);

const emit = defineEmits<{
  'update:sidebarCollapsed': [value: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();
const headerRef = ref<HTMLElement | null>(null);
const subheaderRef = ref<HTMLElement | null>(null);
const mediaCompactAside = useCssVarBreakpointMatch('--vf-breakpoint-xl', vfBreakpoints.xl);
const mediaCompactSidebar = useCssVarBreakpointMatch('--vf-breakpoint-lg', vfBreakpoints.lg);
const isCompactAside = computed(() => props.layout === 'sidebar-content-aside' && mediaCompactAside.value);
const isCompactSidebar = computed(() => props.layout !== 'content' && mediaCompactSidebar.value);
const isSidebarCollapsed = ref(props.defaultSidebarCollapsed);

watchEffect(() => {
  if (props.sidebarCollapsed !== undefined) {
    isSidebarCollapsed.value = props.sidebarCollapsed;
  }
});

function collapseSidebar() {
  isSidebarCollapsed.value = true;
}

function expandSidebar() {
  isSidebarCollapsed.value = false;
}

function toggleSidebarCollapsed() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

const classes = computed(() =>
  cx(
    'vf-app-shell',
    `vf-app-shell--${props.layout}`,
    isCompactAside.value && 'vf-app-shell--compact-aside',
    isCompactSidebar.value && 'vf-app-shell--compact-sidebar',
    props.fillViewport && 'vf-app-shell--fill-viewport',
    props.stickyHeader === true && 'vf-app-shell--header-sticky',
    props.stickyHeader === false && 'vf-app-shell--header-static',
    props.stickySidebar && 'vf-app-shell--sidebar-sticky',
    props.stickyAside && 'vf-app-shell--aside-sticky',
    isSidebarCollapsed.value && 'vf-app-shell--sidebar-collapsed',
  ),
);
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => hasHeader.value && props.showSubheader && Boolean(slots.subheader));
const hasContentSubheader = computed(
  () => props.showContentSubheader && Boolean(slots['content-subheader']) && Boolean(slots.default),
);
const hasFooter = computed(() => Boolean(slots.footer));
function hasSlotContent(name: 'sidebar' | 'aside') {
  const slot = slots[name];

  if (!slot) return false;

  const nodes = slot();

  function hasMeaningfulNode(node: VNode): boolean {
    if (node.type === Comment) return false;
    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0;
    }
    if (node.type === Fragment) {
      const children = Array.isArray(node.children) ? node.children : [];
      return children.some((child) => hasMeaningfulNode(child as VNode));
    }

    return true;
  }

  return nodes.some((node) => hasMeaningfulNode(node));
}
const headerHeight = useObservedElementHeight(headerRef);
const subheaderHeight = useObservedElementHeight(subheaderRef);
const stickyOffsetsStyle = computed<StyleValue>(() => {
  const effectiveHeaderHeight = hasHeader.value ? headerHeight.value : 0;
  const effectiveSubheaderHeight = hasSubheader.value ? subheaderHeight.value : 0;

  return {
    '--vf-sticky-header-offset': `${effectiveHeaderHeight}px`,
    '--vf-sticky-subheader-offset': `${effectiveSubheaderHeight}px`,
    '--vf-sticky-top-offset': `${effectiveHeaderHeight + effectiveSubheaderHeight}px`,
  };
});
const sidebarClasses = computed(() =>
  cx('vf-sidebar-area', props.sidebarAppearance === 'plain' && 'vf-sidebar-area--plain'),
);
const asideClasses = computed(() => cx('vf-aside-area', props.asideAppearance === 'plain' && 'vf-aside-area--plain'));
const contentClasses = computed(() =>
  cx(
    'vf-content-area',
    props.contentPadded && 'vf-content-area--padded',
    props.contentAppearance === 'plain' && 'vf-content-area--plain',
  ),
);

defineExpose({
  collapseSidebar,
  expandSidebar,
  toggleSidebarCollapsed,
});

watchEffect(() => {
  emit('update:sidebarCollapsed', isSidebarCollapsed.value);
});
</script>

<template>
  <component :is="props.as" :class="classes" :style="stickyOffsetsStyle" v-bind="attrs">
    <header v-if="hasHeader" ref="headerRef" class="vf-header-area">
      <VfContainer class="vf-app-shell__header-container">
        <slot name="header" />
      </VfContainer>
    </header>

    <div v-if="hasSubheader" ref="subheaderRef" class="vf-subheader-area">
      <VfContainer class="vf-app-shell__subheader-container">
        <slot name="subheader" />
      </VfContainer>
    </div>

    <div class="vf-app-shell__body">
      <VfContainer class="vf-app-shell__body-container">
        <div class="vf-app-shell__body-grid">
          <aside v-if="props.layout !== 'content' && hasSlotContent('sidebar')" :class="sidebarClasses">
            <div class="vf-sidebar-area__inner">
              <slot
                name="sidebar"
                :is-sidebar-collapsed="isSidebarCollapsed"
                :collapse-sidebar="collapseSidebar"
                :expand-sidebar="expandSidebar"
                :toggle-sidebar-collapsed="toggleSidebarCollapsed"
              />
            </div>
          </aside>

          <main :class="contentClasses">
            <div v-if="hasContentSubheader" class="vf-content-subheader-area">
              <slot name="content-subheader" />
            </div>
            <div class="vf-content-area__body">
              <slot
                :is-sidebar-collapsed="isSidebarCollapsed"
                :collapse-sidebar="collapseSidebar"
                :expand-sidebar="expandSidebar"
                :toggle-sidebar-collapsed="toggleSidebarCollapsed"
              />
            </div>
          </main>

          <aside v-if="props.layout === 'sidebar-content-aside' && hasSlotContent('aside')" :class="asideClasses">
            <div class="vf-aside-area__inner">
              <slot name="aside" />
            </div>
          </aside>
        </div>
      </VfContainer>
    </div>

    <footer v-if="hasFooter" class="vf-footer-area">
      <VfContainer class="vf-app-shell__footer-container">
        <slot name="footer" />
      </VfContainer>
    </footer>
  </component>
</template>
