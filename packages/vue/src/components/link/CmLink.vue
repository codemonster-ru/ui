<script setup lang="ts">
import { computed, resolveComponent, useAttrs, type Component, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { assertCm } from '../../internal/warn';
import type { CmLinkTone, CmLinkUnderline } from './link.types';

defineOptions({ inheritAttrs: false });

const underlines: readonly CmLinkUnderline[] = ['none', 'hover', 'always'];
const tones: readonly CmLinkTone[] = ['default', 'muted'];
const props = defineProps({
  href: { type: String, default: undefined },
  to: { type: [String, Object] as PropType<string | Record<string, unknown>>, default: undefined },
  target: { type: String, default: undefined },
  rel: { type: String, default: undefined },
  component: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
  underline: {
    type: String as PropType<CmLinkUnderline>,
    default: 'none',
    validator: (value: string) => ['none', 'hover', 'always'].includes(value),
  },
  tone: {
    type: String as PropType<CmLinkTone>,
    default: 'default',
    validator: (value: string) => ['default', 'muted'].includes(value),
  },
});
const attrs = useAttrs();
const underline = computed(() => (underlines.includes(props.underline) ? props.underline : 'none'));
const tone = computed(() => (tones.includes(props.tone) ? props.tone : 'default'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-link',
    underline.value === 'none' ? undefined : `cm-link--underline-${underline.value}`,
    tone.value === 'muted' ? 'cm-link--muted' : undefined,
    attrs.class,
  ),
);
const rootAttrs = () => omitCmOwnedAttrs(attrs, []);
const rel = computed(() => props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined));
const destination = computed(() => (props.to === undefined ? { href: props.href } : { to: props.to }));

function linkComponent() {
  return props.to === undefined ? 'a' : (props.component ?? resolveComponent('RouterLink'));
}

assertCm(props.href === undefined || props.href.trim() !== '', 'Link href must be a non-empty string.');
</script>

<template>
  <component
    :is="linkComponent()"
    v-bind="{ ...rootAttrs(), ...destination }"
    :class="classes"
    :target="props.target"
    :rel="rel"
  >
    <slot />
  </component>
</template>
