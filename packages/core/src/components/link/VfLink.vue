<script setup lang="ts">
import { computed, resolveDynamicComponent, useAttrs } from 'vue';
import type { Component } from 'vue';
import { cx } from '@/utils/classes';
import type { VfLinkTone, VfLinkUnderline } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfLinkProps {
  href?: string;
  to?: string | Record<string, unknown>;
  target?: string;
  rel?: string;
  underline?: VfLinkUnderline;
  tone?: VfLinkTone;
  component?: string | Component;
}

const props = withDefaults(defineProps<VfLinkProps>(), {
  href: undefined,
  to: undefined,
  target: undefined,
  rel: undefined,
  underline: 'none',
  tone: 'default',
  component: undefined,
});

const attrs = useAttrs();
const isRouterLink = computed(() => props.to !== undefined);
const resolvedComponent = computed(() => {
  if (!isRouterLink.value) {
    return 'a';
  }

  return props.component ?? resolveDynamicComponent('RouterLink');
});

const resolvedRel = computed(() => {
  if (props.rel) {
    return props.rel;
  }

  return props.target === '_blank' ? 'noopener noreferrer' : undefined;
});

const classes = computed(() =>
  cx(
    'vf-link',
    props.underline === 'hover' && 'vf-link--underline-hover',
    props.underline === 'always' && 'vf-link--underline-always',
    props.tone === 'muted' && 'vf-link--muted',
  ),
);

const linkProps = computed(() => {
  if (isRouterLink.value) {
    return {
      to: props.to,
      target: props.target,
      rel: resolvedRel.value,
    };
  }

  return {
    href: props.href,
    target: props.target,
    rel: resolvedRel.value,
  };
});

const componentProps = computed(() => ({
  ...attrs,
  ...linkProps.value,
  class: classes.value,
}));
</script>

<template>
  <component :is="resolvedComponent" v-bind="componentProps">
    <slot />
  </component>
</template>
