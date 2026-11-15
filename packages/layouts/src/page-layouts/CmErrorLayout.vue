<script setup lang="ts">
import type { CmErrorLayoutProps } from './page-layout.types';

const props = withDefaults(defineProps<CmErrorLayoutProps>(), {
  as: 'section',
  code: null,
  title: null,
  description: null,
  fillViewport: true,
  centered: true,
  surface: true,
});
</script>

<template>
  <component
    :is="props.as"
    class="cm-error-layout"
    :class="{
      'cm-page-layout--fill-viewport': fillViewport,
      'cm-page-layout--centered': centered,
    }"
  >
    <div class="cm-page-layout__container">
      <div class="cm-error-layout__panel cm-page-layout__panel" :class="{ 'cm-page-layout__panel--surface': surface }">
        <p v-if="$slots.code || code !== null" class="cm-error-layout__code">
          <slot name="code">{{ code }}</slot>
        </p>
        <h1 v-if="$slots.title || title" class="cm-error-layout__title">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="$slots.description || description" class="cm-error-layout__description">
          <slot name="description">{{ description }}</slot>
        </p>
        <div v-if="$slots.actions" class="cm-error-layout__actions"><slot name="actions" /></div>
      </div>
    </div>
  </component>
</template>
