<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import VfContainer from '../primitives/VfContainer.vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    title?: string | null;
    description?: string | null;
    fillViewport?: boolean;
    centered?: boolean;
    surface?: boolean;
  }>(),
  {
    as: 'main',
    title: null,
    description: null,
    fillViewport: true,
    centered: true,
    surface: true,
  },
);

const attrs = useAttrs();
const slots = useSlots();

const classes = computed(() =>
  cx(
    'vf-auth-layout',
    props.fillViewport && 'vf-auth-layout--fill-viewport',
    props.centered && 'vf-auth-layout--centered',
  ),
);

const panelClasses = computed(() => cx('vf-auth-layout__panel', props.surface && 'vf-auth-layout__panel--surface'));

const hasBrand = computed(() => Boolean(slots.brand));
const hasTitle = computed(() => Boolean(slots.title) || Boolean(props.title));
const hasDescription = computed(() => Boolean(slots.description) || Boolean(props.description));
const hasHeader = computed(() => hasBrand.value || hasTitle.value || hasDescription.value);
const hasFooter = computed(() => Boolean(slots.footer));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <VfContainer size="md" class="vf-auth-layout__container">
      <div :class="panelClasses">
        <header v-if="hasHeader" class="vf-auth-layout__header">
          <div v-if="hasBrand" class="vf-auth-layout__brand">
            <slot name="brand" />
          </div>
          <h1 v-if="hasTitle" class="vf-auth-layout__title">
            <slot name="title">{{ props.title }}</slot>
          </h1>
          <p v-if="hasDescription" class="vf-auth-layout__description">
            <slot name="description">{{ props.description }}</slot>
          </p>
        </header>
        <div class="vf-auth-layout__body">
          <slot />
        </div>
        <footer v-if="hasFooter" class="vf-auth-layout__footer">
          <slot name="footer" />
        </footer>
      </div>
    </VfContainer>
  </component>
</template>
