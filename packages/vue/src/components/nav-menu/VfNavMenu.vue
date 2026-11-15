<script setup lang="ts">
import { computed } from 'vue';

import { normalizeIconName, resolveNamedIcon } from '../icon/named-icon';
import CmNavMenu from './CmNavMenu.vue';
import type { CmNavMenuItem, VfNavMenuItem, VfNavMenuProps } from './nav-menu.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfNavMenuProps>(), {
  variant: 'default',
  ariaLabel: 'Navigation',
  compact: undefined,
});
const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();
const menu = computed(() => {
  const source = new WeakMap<CmNavMenuItem, VfNavMenuItem>();
  function resolveItem(item: VfNavMenuItem): CmNavMenuItem {
    const entry = {
      ...item,
      children: item.children?.map(resolveItem),
      leadingIcon: item.leadingIcon ? resolveNamedIcon(normalizeIconName(item.leadingIcon)) : undefined,
    };
    source.set(entry, item);
    return entry;
  }
  return { source, items: props.items.map(resolveItem) };
});

function onSelect(item: CmNavMenuItem): void {
  const sourceItem = menu.value.source.get(item);
  if (sourceItem) emit('select', sourceItem);
}
</script>

<template>
  <CmNavMenu
    v-bind="{ ...$attrs, ...props }"
    :items="menu.items"
    :variant="props.variant === 'default' ? 'inline' : props.variant"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @select="onSelect"
  />
</template>
