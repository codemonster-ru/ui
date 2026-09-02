<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';
import { resolveCmIcon, type CmIconFamily, type CmIconGeometry, type CmIconVariant } from '@codemonster-ru/ui-icons';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The geometry to draw, imported from `@codemonster-ru/ui-icons`. */
  icon: { type: Object as PropType<CmIconGeometry>, required: true },
  family: { type: String as PropType<CmIconFamily>, default: 'classic' },
  variant: { type: String as PropType<CmIconVariant>, default: 'regular' },
  /** An accessible name. Without one the icon is hidden, which is right for decoration. */
  label: { type: String, default: null },
});

const attrs = useAttrs();
const rendering = computed(() => resolveCmIcon(props.icon, props.family, props.variant));
const classes = computed(() =>
  mergeCmClasses('cm-icon', `cm-icon--${props.variant}`, `cm-icon--${props.family}`, attrs.class),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class']));
</script>

<template>
  <svg
    v-if="rendering"
    v-bind="rootAttrs"
    :class="classes"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="rendering.viewBox"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label ?? undefined"
    :aria-hidden="props.label ? undefined : 'true'"
    focusable="false"
    v-html="rendering.body"
  />
</template>
