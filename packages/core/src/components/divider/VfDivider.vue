<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { resolveDividerClasses, resolveDividerRole } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';
import type { VfDividerOrientation } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfDividerProps {
  orientation?: VfDividerOrientation;
}

const props = withDefaults(defineProps<VfDividerProps>(), {
  orientation: 'horizontal',
});

const attrs = useAttrs();

const role = computed(() => resolveDividerRole(props.orientation));
const classes = computed(() => cx(...resolveDividerClasses(props.orientation)));
</script>

<template>
  <div :class="classes" :aria-orientation="props.orientation" :role="role" v-bind="attrs" />
</template>
