<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmTableDensity } from './table.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  caption: { type: String, default: '' },
  density: {
    type: String as PropType<CmTableDensity>,
    default: 'default',
    validator: (value: string) => ['default', 'compact'].includes(value),
  },
  striped: Boolean,
  columnDividers: Boolean,
  stickyHeader: Boolean,
});
const attrs = useAttrs();
const rootClasses = computed(() => mergeCmClasses('cm-table-wrap', attrs.class as CmClassValue));
const tableClasses = computed(() =>
  mergeCmClasses(
    'cm-table',
    props.density === 'compact' ? 'cm-table--compact' : undefined,
    props.striped ? 'cm-table--striped' : undefined,
    props.columnDividers ? 'cm-table--column-dividers' : undefined,
    props.stickyHeader ? 'cm-table--sticky-header' : undefined,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
</script>

<template>
  <div v-bind="rootAttrs" :class="rootClasses">
    <div class="cm-table__scroll">
      <table :class="tableClasses">
        <caption v-if="$slots.caption || props.caption" class="cm-table__caption">
          <slot name="caption">{{ props.caption }}</slot>
        </caption>
        <thead v-if="$slots.header" class="cm-table__head">
          <slot name="header" />
        </thead>
        <tbody v-if="$slots.default" class="cm-table__body">
          <slot />
        </tbody>
        <tfoot v-if="$slots.footer" class="cm-table__foot">
          <slot name="footer" />
        </tfoot>
      </table>
    </div>
  </div>
</template>
