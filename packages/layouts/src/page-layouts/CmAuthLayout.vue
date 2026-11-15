<script setup lang="ts">
import type { CmAuthLayoutProps } from './page-layout.types';

const props = withDefaults(defineProps<CmAuthLayoutProps>(), {
  as: 'main',
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
    class="cm-auth-layout"
    :class="{
      'cm-page-layout--fill-viewport': fillViewport,
      'cm-page-layout--centered': centered,
    }"
  >
    <div class="cm-page-layout__container">
      <div class="cm-auth-layout__panel cm-page-layout__panel" :class="{ 'cm-page-layout__panel--surface': surface }">
        <header
          v-if="$slots.brand || $slots.title || title || $slots.description || description"
          class="cm-auth-layout__header"
        >
          <div v-if="$slots.brand" class="cm-auth-layout__brand"><slot name="brand" /></div>
          <h1 v-if="$slots.title || title" class="cm-auth-layout__title">
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="$slots.description || description" class="cm-auth-layout__description">
            <slot name="description">{{ description }}</slot>
          </p>
        </header>
        <div class="cm-auth-layout__body"><slot /></div>
        <footer v-if="$slots.footer" class="cm-auth-layout__footer"><slot name="footer" /></footer>
      </div>
    </div>
  </component>
</template>
