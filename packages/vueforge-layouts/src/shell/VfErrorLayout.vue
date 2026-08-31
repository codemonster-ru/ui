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
    code?: string | number | null;
    title?: string | null;
    description?: string | null;
    fillViewport?: boolean;
    centered?: boolean;
    surface?: boolean;
  }>(),
  {
    as: 'section',
    code: null,
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
    'vf-error-layout',
    props.fillViewport && 'vf-error-layout--fill-viewport',
    props.centered && 'vf-error-layout--centered',
  ),
);

const panelClasses = computed(() => cx('vf-error-layout__panel', props.surface && 'vf-error-layout__panel--surface'));

const hasCode = computed(() => Boolean(slots.code) || (props.code !== null && props.code !== undefined));
const hasTitle = computed(() => Boolean(slots.title) || Boolean(props.title));
const hasDescription = computed(() => Boolean(slots.description) || Boolean(props.description));
const hasActions = computed(() => Boolean(slots.actions));
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs">
    <VfContainer size="md" class="vf-error-layout__container">
      <div :class="panelClasses">
        <p v-if="hasCode" class="vf-error-layout__code">
          <slot name="code">{{ props.code }}</slot>
        </p>
        <h1 v-if="hasTitle" class="vf-error-layout__title">
          <slot name="title">{{ props.title }}</slot>
        </h1>
        <p v-if="hasDescription" class="vf-error-layout__description">
          <slot name="description">{{ props.description }}</slot>
        </p>
        <div v-if="hasActions" class="vf-error-layout__actions">
          <slot name="actions" />
        </div>
      </div>
    </VfContainer>
  </component>
</template>
