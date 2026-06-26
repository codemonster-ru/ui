<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VfMenuBarItemNode from './VfMenuBarItemNode.vue';
import VfHorizontalScroller from '@/components/internal/VfHorizontalScroller.vue';
import { useClickOutside, useEscapeKey } from '@/composables';
import type { VfNavMenuItem } from '@/types/components';

interface VfMenuBarProps {
  items: VfNavMenuItem[];
  modelValue?: string;
  defaultValue?: string;
  ariaLabel?: string;
  variant?: 'default' | 'pills';
}

const props = withDefaults(defineProps<VfMenuBarProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  ariaLabel: 'Menu bar',
  variant: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();

const rootRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const teleportReady = ref(false);
const internalValue = ref(props.defaultValue);
const openPath = ref<string[]>([]);
const activeValue = computed(() => props.modelValue ?? internalValue.value);
let closeMenuTimer: ReturnType<typeof setTimeout> | undefined;

function setActiveValue(value: string) {
  if (props.modelValue === undefined) {
    internalValue.value = value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}

function handleSelect(item: VfNavMenuItem) {
  setActiveValue(item.value);
  openPath.value = [];
  emit('select', item);
}

function handleOpenPathChange(path: string[]) {
  cancelCloseMenu();
  openPath.value = path;
}

function scheduleCloseMenu() {
  cancelCloseMenu();
  closeMenuTimer = setTimeout(() => {
    openPath.value = [];
    closeMenuTimer = undefined;
  }, 120);
}

function cancelCloseMenu() {
  if (closeMenuTimer === undefined) {
    return;
  }

  clearTimeout(closeMenuTimer);
  closeMenuTimer = undefined;
}

useClickOutside(
  [rootRef, overlayRef],
  () => {
    openPath.value = [];
  },
  {
    enabled: computed(() => openPath.value.length > 0),
  },
);

useEscapeKey(
  (event) => {
    if (openPath.value.length === 0) {
      return;
    }

    event.preventDefault();
    openPath.value = [];
  },
  {
    enabled: computed(() => openPath.value.length > 0),
  },
);

watch(
  () => props.items,
  () => {
    openPath.value = [];
  },
  { deep: true },
);

onBeforeUnmount(() => {
  cancelCloseMenu();
});

onMounted(() => {
  teleportReady.value = true;
});
</script>

<template>
  <nav
    ref="rootRef"
    :class="['vf-menu-bar', `vf-menu-bar--${variant}`]"
    :aria-label="ariaLabel"
    @mouseenter="cancelCloseMenu"
    @mouseleave="scheduleCloseMenu"
  >
    <div ref="overlayRef" class="vf-menu-bar__overlay" />
    <VfHorizontalScroller
      class="vf-menu-bar__scroller"
      left-aria-label="Scroll menu left"
      right-aria-label="Scroll menu right"
      left-control-class="vf-menu-bar__scroll-button vf-menu-bar__scroll-button--left"
      right-control-class="vf-menu-bar__scroll-button vf-menu-bar__scroll-button--right"
      hidden-control-class="vf-menu-bar__scroll-button--hidden"
    >
      <ul class="vf-menu-bar__list" role="menubar">
        <VfMenuBarItemNode
          v-for="item in items"
          :key="item.value"
          :item="item"
          :depth="0"
          :parent-path="[]"
          :active-value="activeValue"
          :open-path="openPath"
          :hover-enabled="openPath.length > 0"
          :submenu-teleport-target="overlayRef"
          :teleport-enabled="teleportReady"
          @open-path-change="handleOpenPathChange"
          @select="handleSelect"
        />
      </ul>
    </VfHorizontalScroller>
  </nav>
</template>
