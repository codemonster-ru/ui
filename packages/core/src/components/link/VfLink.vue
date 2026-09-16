<script setup lang="ts">
import { computed, resolveDynamicComponent, useAttrs } from 'vue';
import type { Component } from 'vue';
import { resolveLinkClasses, resolveLinkRel } from '@codemonster-ru/vueforge-shared-core';
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
// The router branch is this adapter's own. `to` selects it, the component is
// resolved by the name a Vue application registers, and nothing here reads a
// route: the destination is handed over untouched, and with nothing registered
// Vue renders a literal unresolved element. The shared rules below know nothing
// about any of this, which is what keeps the Razor adapter from needing to.
const isRouterLink = computed(() => props.to !== undefined);
const externalClass = computed(() => attrs.class);
const resolvedComponent = computed(() => {
  if (!isRouterLink.value) {
    return 'a';
  }

  return props.component ?? resolveDynamicComponent('RouterLink');
});

const resolvedRel = computed(() => resolveLinkRel(props.rel, props.target));

const classes = computed(() => cx(...resolveLinkClasses(props.underline, props.tone)));

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
  class: [classes.value, externalClass.value],
}));
</script>

<template>
  <component :is="resolvedComponent" v-bind="componentProps">
    <slot />
  </component>
</template>
