<script setup lang="ts">
import { chevronRight } from '@codemonster-ru/ui-icons';

import CmBreadcrumbs from '../breadcrumbs/CmBreadcrumbs.vue';
import type { CmBreadcrumbItem } from '../breadcrumbs/breadcrumbs.types';
import CmIcon from '../icon/CmIcon.vue';
import type { CmPageHeaderHeadingLevel } from './page-header.types';

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    breadcrumbs?: readonly CmBreadcrumbItem[];
    headingLevel?: CmPageHeaderHeadingLevel;
  }>(),
  { title: undefined, description: undefined, breadcrumbs: () => [], headingLevel: 1 },
);
</script>

<template>
  <header class="cm-page-header">
    <div v-if="props.breadcrumbs.length || $slots.breadcrumbs" class="cm-page-header__breadcrumbs">
      <slot name="breadcrumbs">
        <CmBreadcrumbs :items="props.breadcrumbs">
          <template #separator>
            <CmIcon :icon="chevronRight" />
          </template>
        </CmBreadcrumbs>
      </slot>
    </div>
    <div class="cm-page-header__row">
      <div class="cm-page-header__content">
        <component :is="`h${props.headingLevel}`" v-if="props.title || $slots.title" class="cm-page-header__title">
          <slot name="title">{{ props.title }}</slot>
        </component>
        <div v-if="props.description || $slots.description" class="cm-page-header__description">
          <slot name="description">{{ props.description }}</slot>
        </div>
      </div>
      <div v-if="$slots.actions" class="cm-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
