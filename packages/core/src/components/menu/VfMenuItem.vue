<script setup lang="ts">
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { computed, useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

interface VfMenuItemProps {
  label: string;
  icon?: IconName | string;
  disabled?: boolean;
  active?: boolean;
  tone?: 'default' | 'danger';
  href?: string;
  target?: string;
  rel?: string;
}

const props = withDefaults(defineProps<VfMenuItemProps>(), {
  icon: undefined,
  disabled: false,
  active: false,
  tone: 'default',
  href: undefined,
  target: undefined,
  rel: undefined,
});

const emit = defineEmits<{
  select: [];
}>();

const attrs = useAttrs();
const classes = computed(() => [
  'vf-menu__item',
  props.active && 'vf-menu__item--active',
  props.tone === 'danger' && 'vf-menu__item--danger',
]);

function handleSelect(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault();
    return;
  }

  emit('select');
}
</script>

<template>
  <a
    v-if="props.href"
    v-bind="attrs"
    :class="classes"
    :href="props.disabled ? undefined : props.href"
    :target="props.target"
    :rel="props.rel"
    :aria-disabled="props.disabled || undefined"
    :tabindex="props.disabled ? -1 : undefined"
    role="menuitem"
    @click="handleSelect"
  >
    <VueIconify v-if="props.icon" class="vf-menu__item-icon" :icon="props.icon" aria-hidden="true" />
    <span class="vf-menu__item-label">{{ props.label }}</span>
  </a>

  <button
    v-else
    v-bind="attrs"
    :class="classes"
    type="button"
    :disabled="props.disabled"
    :aria-disabled="props.disabled || undefined"
    role="menuitem"
    @click="handleSelect"
  >
    <VueIconify v-if="props.icon" class="vf-menu__item-icon" :icon="props.icon" aria-hidden="true" />
    <span class="vf-menu__item-label">{{ props.label }}</span>
  </button>
</template>
