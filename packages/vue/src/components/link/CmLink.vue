<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmLinkTone, CmLinkUnderline } from './link.types';

defineOptions({ inheritAttrs: false });

const underlines: readonly CmLinkUnderline[] = ['none', 'hover', 'always'];
const tones: readonly CmLinkTone[] = ['default', 'muted'];
const props = defineProps({
  href: { type: String, required: true },
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
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['href', 'rel']));
const rel = computed(() =>
  typeof attrs.rel === 'string' ? attrs.rel : attrs.target === '_blank' ? 'noopener noreferrer' : undefined,
);

if (!props.href.trim()) throw new TypeError('Link href must be a non-empty string.');
</script>

<template>
  <a v-bind="rootAttrs" :class="classes" :href="props.href" :rel="rel"><slot /></a>
</template>
