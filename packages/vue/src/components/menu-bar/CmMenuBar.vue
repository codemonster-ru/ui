<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import { collectAncestorValues } from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import CmMenuBarNode from './CmMenuBarNode.vue';
import type { CmMenuBarItem } from './menu-bar.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmMenuBarItem[]>, required: true },
  openPath: { type: Array as PropType<readonly string[] | null>, default: null },
  ariaLabel: { type: String, default: 'Main menu' },
});
const emit = defineEmits<{
  select: [value: string];
  openPathChange: [values: string[]];
  'update:openPath': [values: string[]];
}>();
const attrs = useAttrs();

const localPath = ref<string[]>(props.openPath === null ? [] : [...props.openPath]);
watch(
  () => props.openPath,
  (path) => {
    if (path !== null) localPath.value = [...path];
  },
);

const openPath = computed(() => (props.openPath === null ? localPath.value : [...props.openPath]));
const classes = computed(() => mergeCmClasses('cm-menu-bar', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'aria-label', 'data-cm-controller']));

// A menu bar shows one path at a time, so opening a branch replaces the path rather than adding to
// it: the ancestors take it there, and the branch itself ends it.
function onToggle(value: string): void {
  const next = openPath.value.includes(value)
    ? collectAncestorValues(props.items, value)
    : [...collectAncestorValues(props.items, value), value];

  if (props.openPath === null) localPath.value = next;
  emit('update:openPath', next);
  emit('openPathChange', next);
}

function onSelect(value: string): void {
  emit('select', value);
  if (props.openPath === null) localPath.value = [];
  emit('update:openPath', []);
  emit('openPathChange', []);
}

useCmHydrated();
</script>

<template>
  <nav v-bind="rootAttrs" :class="classes" :aria-label="props.ariaLabel" data-cm-controller="menu-bar">
    <ul class="cm-menu-bar__list" role="menubar">
      <CmMenuBarNode
        v-for="item in props.items"
        :key="item.value"
        :item="item"
        :depth="0"
        :open-path="openPath"
        @toggle="onToggle"
        @select="onSelect"
      />
    </ul>
  </nav>
</template>
