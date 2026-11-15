<script setup lang="ts">
import CmTooltip from './CmTooltip.vue';
import type { VfTooltipProps } from './tooltip.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfTooltipProps>(), {
  openDelay: 80,
  placement: 'top',
  teleportTo: 'body',
});
</script>

<template>
  <CmTooltip
    v-bind="$attrs"
    :text="props.text"
    :placement="props.placement"
    :open-delay="props.openDelay"
    :teleport-to="props.teleportTo"
    :disable-teleport="props.disableTeleport"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </CmTooltip>
</template>
