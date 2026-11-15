<script setup lang="ts">
import { computed } from 'vue';

import { normalizeIconName, resolveNamedIcon } from '../icon/named-icon';
import type { VfNavMenuItem } from '../nav-menu/nav-menu.types';
import CmMenuBar from './CmMenuBar.vue';
import type { CmMenuBarItem, VfMenuBarProps } from './menu-bar.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfMenuBarProps>(), { ariaLabel: 'Menu bar', variant: 'default' });
const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();

const menu = computed(() => {
  const byValue = new Map<string, VfNavMenuItem>();
  function resolveItem(item: VfNavMenuItem): CmMenuBarItem {
    byValue.set(item.value, item);
    return {
      ...item,
      children: item.children?.map(resolveItem),
      leadingIcon: item.leadingIcon ? resolveNamedIcon(normalizeIconName(item.leadingIcon)) : undefined,
    };
  }
  return { items: props.items.map(resolveItem), byValue };
});

function onSelect(value: string): void {
  const item = menu.value.byValue.get(value);
  if (item) emit('select', item);
}
</script>

<template>
  <CmMenuBar
    v-bind="$attrs"
    :items="menu.items"
    :model-value="props.modelValue"
    :default-value="props.defaultValue"
    :variant="props.variant"
    :aria-label="props.ariaLabel"
    :link-component="props.linkComponent"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @select="onSelect"
  />
</template>
