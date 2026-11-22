<script setup lang="ts">
import { chevronDown } from '@codemonster-ru/ui-icons/controls';
import { computed, ref, useId } from 'vue';

import { useCmHydrated } from '../../internal/hydration';
import CmButton from '../button/CmButton.vue';
import CmIcon from '../icon/CmIcon.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    collapsible?: boolean;
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    disabled?: boolean;
  }>(),
  { title: undefined, collapsed: undefined },
);
const slots = defineSlots<{
  default?: (props: { collapsed: boolean }) => unknown;
  title?: (props: { collapsed: boolean }) => unknown;
  'toggle-icon'?: (props: { collapsed: boolean }) => unknown;
}>();
const emit = defineEmits<{
  'update:collapsed': [collapsed: boolean];
  collapsedChange: [collapsed: boolean];
}>();

const id = useId();
const triggerId = `cm-group-box-${id}-trigger`;
const contentId = `cm-group-box-${id}-content`;
const localCollapsed = ref(props.defaultCollapsed);
const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title));
const canCollapse = computed(() => props.collapsible && hasTitle.value);
const isCollapsed = computed(() => canCollapse.value && (props.collapsed ?? localCollapsed.value));

function toggle(): void {
  if (!canCollapse.value || props.disabled) return;
  const collapsed = !isCollapsed.value;
  if (props.collapsed === undefined) localCollapsed.value = collapsed;
  emit('update:collapsed', collapsed);
  emit('collapsedChange', collapsed);
}

useCmHydrated();
</script>

<template>
  <fieldset
    :data-cm-controller="canCollapse ? 'group-box' : undefined"
    :disabled="isCollapsed || undefined"
    class="cm-group-box"
    :class="{
      'cm-group-box--titled': hasTitle,
      'cm-group-box--collapsible': canCollapse,
      'cm-group-box--collapsed': isCollapsed,
    }"
  >
    <legend v-if="hasTitle" class="cm-group-box__legend">
      <CmButton
        v-if="canCollapse"
        :id="triggerId"
        :aria-controls="contentId"
        :aria-expanded="!isCollapsed"
        :disabled="props.disabled"
        class="cm-group-box__trigger"
        variant="ghost"
        size="md"
        @click="toggle"
      >
        <template #leading>
          <slot name="toggle-icon" :collapsed="isCollapsed">
            <CmIcon :icon="chevronDown" class="cm-group-box__icon" />
          </slot>
        </template>
        <span class="cm-group-box__title">
          <slot name="title" :collapsed="isCollapsed">{{ props.title }}</slot>
        </span>
      </CmButton>
      <span v-else class="cm-group-box__title">
        <slot name="title" :collapsed="false">{{ props.title }}</slot>
      </span>
    </legend>

    <div
      :id="contentId"
      :aria-labelledby="canCollapse ? triggerId : undefined"
      :hidden="isCollapsed"
      :role="canCollapse ? 'region' : undefined"
      class="cm-group-box__content"
    >
      <slot :collapsed="isCollapsed" />
    </div>
  </fieldset>
</template>
