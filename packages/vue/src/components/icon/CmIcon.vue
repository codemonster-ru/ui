<script setup lang="ts">
import { computed, mergeProps, useAttrs, useId, type PropType } from 'vue';
import { scopeCmIconIds, type CmIconFamily, type CmIconGeometry, type CmIconVariant } from '@codemonster-ru/ui-icons';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** The geometry to draw, imported from `@codemonster-ru/ui-icons`. */
  icon: { type: Object as PropType<CmIconGeometry>, required: true },
  family: { type: String as PropType<CmIconFamily>, default: 'classic' },
  variant: { type: String as PropType<CmIconVariant>, default: 'regular' },
  size: { type: [Number, String], default: undefined },
  spin: { type: Boolean, default: false },
  inset: { type: Number, default: 0 },
  secondaryColor: { type: String, default: undefined },
  secondaryOpacity: { type: [Number, String], default: undefined },
  /** An accessible name. Without one the icon is hidden, which is right for decoration. */
  label: { type: String, default: null },
});

const attrs = useAttrs();
const id = `cm-icon-${useId()}`;
const requested = computed(() => props.icon[`${props.family}/${props.variant}`]);
const rendering = computed(() => requested.value ?? props.icon['classic/solid']);
const body = computed(() => (rendering.value ? scopeCmIconIds(rendering.value.body, id) : ''));
const classes = computed(() =>
  mergeCmClasses(
    'cm-icon',
    `cm-icon--${requested.value ? props.variant : 'solid'}`,
    `cm-icon--${requested.value ? props.family : 'classic'}`,
    props.spin && 'cm-icon--spin',
    attrs.class,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'aria-label']));
const label = computed(
  () => props.label || (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : undefined),
);
const style = computed(() => {
  if (
    props.size === undefined &&
    !props.inset &&
    props.secondaryColor === undefined &&
    props.secondaryOpacity === undefined
  )
    return undefined;

  return {
    '--cm-icon-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
    '--cm-icon-scale': props.inset ? 1 - Math.min(Math.max(props.inset, -0.25), 0.49) * 2 : undefined,
    '--vf-icon-secondary-color': props.secondaryColor,
    '--vf-icon-secondary-opacity': props.secondaryOpacity,
  };
});
</script>

<template>
  <svg
    v-if="rendering"
    v-bind="style ? mergeProps(rootAttrs, { style }) : rootAttrs"
    :class="classes"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="rendering.viewBox"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
    v-html="body"
  />
</template>
