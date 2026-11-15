<script setup lang="ts">
defineProps<{
  title?: string;
  subtle?: boolean;
}>();
</script>

<template>
  <section class="cm-panel" :class="{ 'cm-panel--subtle': subtle }">
    <header v-if="title || $slots.header">
      <slot name="header">
        <h3 class="cm-panel__title">{{ title }}</h3>
      </slot>
    </header>
    <slot />
  </section>
</template>
