<script setup lang="ts">
import { moon, sun } from '@codemonster-ru/ui-icons';
import { computed, useAttrs } from 'vue';

import CmButton from '../button/CmButton.vue';
import CmIconButton from '../icon-button/CmIconButton.vue';
import CmIcon from '../icon/CmIcon.vue';
import CmSwitch from '../switch/CmSwitch.vue';
import type { CmSwitchSize, CmSwitchThumbContrast } from '../switch/switch.types';
import { useCmTheme } from '../theme-provider/use-theme';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    size?: CmSwitchSize;
    disabled?: boolean;
    label?: string;
    static?: boolean;
    thumbContrast?: CmSwitchThumbContrast;
    variant?: 'switch' | 'button';
    buttonVariant?: 'secondary' | 'ghost';
  }>(),
  {
    size: 'md',
    label: undefined,
    thumbContrast: 'auto',
    variant: 'switch',
    buttonVariant: 'secondary',
  },
);
const slots = defineSlots<{
  default?(): unknown;
  thumb?(props: { checked: boolean }): unknown;
}>();
const attrs = useAttrs();
const { resolvedTheme, setTheme, toggleTheme } = useCmTheme();
const checked = computed(() => resolvedTheme.value === 'dark');
const icon = computed(() => (checked.value ? moon : sun));
const hasContent = computed(() => Boolean(props.label || slots.default));
const actionLabel = computed(() => (checked.value ? 'Switch to light theme' : 'Switch to dark theme'));
</script>

<template>
  <template v-if="props.variant === 'button'">
    <CmButton
      v-if="hasContent"
      v-bind="attrs"
      :aria-label="actionLabel"
      :variant="props.buttonVariant"
      :size="props.size"
      :disabled="props.disabled"
      @click="toggleTheme"
    >
      <template #leading><CmIcon :icon="icon" /></template>
      <slot>{{ props.label }}</slot>
    </CmButton>
    <CmIconButton
      v-else
      v-bind="attrs"
      :label="actionLabel"
      :variant="props.buttonVariant"
      :size="props.size"
      :disabled="props.disabled"
      @click="toggleTheme"
    >
      <CmIcon :icon="icon" />
    </CmIconButton>
  </template>
  <CmSwitch
    v-else
    v-bind="attrs"
    :model-value="checked"
    :size="props.size"
    :disabled="props.disabled"
    :label="props.label"
    :aria-label="hasContent ? undefined : actionLabel"
    :static="props.static"
    :thumb-contrast="props.thumbContrast"
    @update:model-value="setTheme($event ? 'dark' : 'light')"
  >
    <template #thumb="{ checked: thumbChecked }">
      <slot name="thumb" :checked="thumbChecked"><CmIcon :icon="icon" /></slot>
    </template>
    <template v-if="hasContent" #default
      ><slot>{{ props.label }}</slot></template
    >
  </CmSwitch>
</template>
