<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { resolveTableClasses, resolveTableSections } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfTableProps {
  caption?: string;
  columnDividers?: boolean;
  compact?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
}

const props = withDefaults(defineProps<VfTableProps>(), {
  caption: undefined,
  columnDividers: false,
  compact: false,
  striped: false,
  stickyHeader: false,
});

const attrs = useAttrs();
const slots = useSlots();

const classes = computed(() =>
  cx(
    ...resolveTableClasses({
      columnDividers: props.columnDividers,
      compact: props.compact,
      striped: props.striped,
      stickyHeader: props.stickyHeader,
    }),
  ),
);

// A function, not a computed: the reference reads $slots in the template, so a
// slot a parent adds or removes after mount opens or closes its section on the
// next render. A computed over useSlots() would cache the first answer.
function sections() {
  return resolveTableSections({
    caption: props.caption,
    hasCaptionSlot: Boolean(slots.caption),
    hasHeaderSlot: Boolean(slots.header),
    hasDefaultSlot: Boolean(slots.default),
    hasFooterSlot: Boolean(slots.footer),
  });
}
</script>

<template>
  <div class="vf-table-wrap" v-bind="attrs">
    <div class="vf-table-scroll">
      <table :class="classes">
        <caption v-if="sections().caption" class="vf-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>

        <thead v-if="sections().head" class="vf-table__head">
          <slot name="header" />
        </thead>

        <tbody v-if="sections().body" class="vf-table__body">
          <slot />
        </tbody>

        <tfoot v-if="sections().foot" class="vf-table__foot">
          <slot name="footer" />
        </tfoot>
      </table>
    </div>
  </div>
</template>
