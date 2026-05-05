<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfTableProps {
  caption?: string;
  compact?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
}

const props = withDefaults(defineProps<VfTableProps>(), {
  caption: undefined,
  compact: false,
  striped: false,
  stickyHeader: false,
});

const attrs = useAttrs();

const classes = computed(() =>
  cx(
    'vf-table',
    props.compact && 'vf-table--compact',
    props.striped && 'vf-table--striped',
    props.stickyHeader && 'vf-table--sticky-header',
  ),
);
</script>

<template>
  <div class="vf-table-wrap" v-bind="attrs">
    <div class="vf-table-scroll">
      <table :class="classes">
        <caption v-if="props.caption || $slots.caption" class="vf-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>

        <thead v-if="$slots.header" class="vf-table__head">
          <slot name="header" />
        </thead>

        <tbody v-if="$slots.default" class="vf-table__body">
          <slot />
        </tbody>

        <tfoot v-if="$slots.footer" class="vf-table__foot">
          <slot name="footer" />
        </tfoot>
      </table>
    </div>
  </div>
</template>
