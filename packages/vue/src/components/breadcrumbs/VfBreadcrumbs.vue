<script setup lang="ts">
import { chevronRight } from '@codemonster-ru/ui-icons';

import CmIcon from '../icon/CmIcon.vue';
import CmBreadcrumbs from './CmBreadcrumbs.vue';
import type { VfBreadcrumbItem, VfBreadcrumbsProps } from './breadcrumbs.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<VfBreadcrumbsProps>();
defineSlots<{ separator?(scope: { item: VfBreadcrumbItem; index: number }): unknown }>();
</script>

<template>
  <CmBreadcrumbs v-bind="{ ...$attrs, ...props }">
    <template #separator="scope">
      <slot name="separator" v-bind="scope"><CmIcon :icon="chevronRight" size="var(--cm-icon-size-sm)" /></slot>
    </template>
  </CmBreadcrumbs>
</template>
