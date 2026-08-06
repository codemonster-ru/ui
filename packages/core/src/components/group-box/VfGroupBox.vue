<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import VfButton from '@/components/button/VfButton.vue';
import { useDisclosure, useId } from '@/composables';
import { cx } from '@/utils/classes';

defineOptions({
  inheritAttrs: false,
});

interface VfGroupBoxProps {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<VfGroupBoxProps>(), {
  title: undefined,
  collapsible: false,
  collapsed: undefined,
  defaultCollapsed: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
  collapsedChange: [value: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();
const triggerId = useId({ prefix: 'vf-group-box-trigger' });
const contentId = useId({ prefix: 'vf-group-box-content' });
const disclosure = useDisclosure({
  defaultOpen: !props.defaultCollapsed,
  open: computed(() => (props.collapsed === undefined ? undefined : !props.collapsed)),
  onOpenChange: (open) => {
    const collapsed = !open;
    emit('update:collapsed', collapsed);
    emit('collapsedChange', collapsed);
  },
});
const hasTitle = computed(() => Boolean(props.title) || Boolean(slots.title));
const isCollapsible = computed(() => props.collapsible && hasTitle.value);
const isCollapsed = computed(() => isCollapsible.value && !disclosure.isOpen.value);
const classes = computed(() =>
  cx(
    'vf-group-box',
    hasTitle.value && 'vf-group-box--titled',
    isCollapsible.value && 'vf-group-box--collapsible',
    isCollapsed.value && 'vf-group-box--collapsed',
  ),
);

function toggle() {
  if (isCollapsible.value && !props.disabled) {
    disclosure.toggle();
  }
}
</script>

<template>
  <fieldset :class="classes" v-bind="attrs">
    <legend v-if="hasTitle" class="vf-group-box__legend">
      <VfButton
        v-if="isCollapsible"
        :id="triggerId"
        :aria-controls="contentId"
        :aria-expanded="!isCollapsed"
        :disabled="props.disabled"
        class="vf-group-box__trigger"
        variant="ghost"
        @click="toggle"
      >
        <slot name="toggle-icon" :collapsed="isCollapsed">
          <span aria-hidden="true" class="vf-group-box__icon">
            <VueIconify :icon="icons.chevronDown" size="var(--vf-icon-size-sm)" />
          </span>
        </slot>
        <span class="vf-group-box__title">
          <slot name="title" :collapsed="isCollapsed">{{ props.title }}</slot>
        </span>
      </VfButton>

      <span v-else class="vf-group-box__title">
        <slot name="title" :collapsed="false">{{ props.title }}</slot>
      </span>
    </legend>

    <div
      v-if="!isCollapsed"
      :id="contentId"
      :aria-labelledby="isCollapsible ? triggerId : undefined"
      class="vf-group-box__content"
      :role="isCollapsible ? 'region' : undefined"
    >
      <slot :collapsed="isCollapsed" />
    </div>
  </fieldset>
</template>
