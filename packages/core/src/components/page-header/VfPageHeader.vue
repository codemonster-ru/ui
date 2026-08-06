<script setup lang="ts">
import { computed, useSlots } from 'vue';
import VfBreadcrumbs from '@/components/breadcrumbs/VfBreadcrumbs.vue';
import type { VfBreadcrumbItem, VfPageHeaderHeadingLevel } from '@/types/components';

interface VfPageHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: VfBreadcrumbItem[];
  headingLevel?: VfPageHeaderHeadingLevel;
}

const props = withDefaults(defineProps<VfPageHeaderProps>(), {
  title: undefined,
  description: undefined,
  breadcrumbs: () => [],
  headingLevel: 1,
});

const slots = useSlots();
const headingTag = computed(() => `h${props.headingLevel}` as const);
const hasBreadcrumbs = computed(() => props.breadcrumbs.length > 0 || Boolean(slots.breadcrumbs));
const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title));
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
</script>

<template>
  <header class="vf-page-header">
    <div v-if="hasBreadcrumbs" class="vf-page-header__breadcrumbs">
      <slot name="breadcrumbs">
        <VfBreadcrumbs :items="props.breadcrumbs" />
      </slot>
    </div>

    <div class="vf-page-header__row">
      <div class="vf-page-header__content">
        <component :is="headingTag" v-if="hasTitle" class="vf-page-header__title">
          <slot name="title">{{ props.title }}</slot>
        </component>
        <div v-if="hasDescription" class="vf-page-header__description">
          <slot name="description">{{ props.description }}</slot>
        </div>
      </div>

      <div v-if="$slots.actions" class="vf-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
