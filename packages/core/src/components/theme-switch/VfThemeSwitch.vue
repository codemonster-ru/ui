<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useSlots, watch } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { useTheme } from '@/composables';
import VfButton from '@/components/button/VfButton.vue';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import VfSwitch from '@/components/switch/VfSwitch.vue';
import type { VfButtonVariant, VfControlSize, VfSwitchThumbContrast } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

type VfThemeSwitchVariant = 'switch' | 'button';
type VfThemeSwitchButtonVariant = Extract<VfButtonVariant, 'secondary' | 'ghost'>;

interface VfThemeSwitchProps {
  size?: VfControlSize;
  disabled?: boolean;
  label?: string;
  static?: boolean;
  thumbContrast?: VfSwitchThumbContrast;
  variant?: VfThemeSwitchVariant;
  buttonVariant?: VfThemeSwitchButtonVariant;
}

const props = withDefaults(defineProps<VfThemeSwitchProps>(), {
  size: 'md',
  disabled: false,
  label: undefined,
  static: false,
  thumbContrast: 'auto',
  variant: 'switch',
  buttonVariant: 'secondary',
});

const attrs = useAttrs();
const slots = useSlots();
const { resolvedTheme, setTheme } = useTheme();
const hasContent = computed(() => Boolean(props.label || slots.default));
const checked = ref(false);
const iconName = computed(() => (checked.value ? icons.moon : icons.sun));
const nextThemeLabel = computed(() => (checked.value ? 'Switch to light theme' : 'Switch to dark theme'));
let pendingThemeFrame: number | null = null;

watch(
  resolvedTheme,
  (value) => {
    checked.value = value === 'dark';
  },
  { immediate: true },
);

function handleCheckedChange(value: boolean) {
  if (typeof window === 'undefined') {
    setTheme(value ? 'dark' : 'light');
    return;
  }

  if (pendingThemeFrame !== null) {
    window.cancelAnimationFrame(pendingThemeFrame);
  }

  pendingThemeFrame = window.requestAnimationFrame(() => {
    setTheme(value ? 'dark' : 'light');
    pendingThemeFrame = null;
  });
}

function handleButtonClick() {
  handleCheckedChange(!checked.value);
}

onBeforeUnmount(() => {
  if (pendingThemeFrame !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(pendingThemeFrame);
  }
});
</script>

<template>
  <template v-if="props.variant === 'button'">
    <VfButton
      v-if="hasContent"
      class="vf-theme-switch vf-theme-switch--button"
      v-bind="attrs"
      :variant="props.buttonVariant"
      :size="props.size"
      :disabled="props.disabled"
      :aria-label="nextThemeLabel"
      @click="handleButtonClick"
    >
      <VueIconify :icon="iconName" aria-hidden="true" />
      <slot>{{ props.label }}</slot>
    </VfButton>
    <VfIconButton
      v-else
      class="vf-theme-switch vf-theme-switch--button"
      v-bind="attrs"
      :variant="props.buttonVariant"
      :size="props.size"
      :disabled="props.disabled"
      :icon="iconName"
      :aria-label="nextThemeLabel"
      @click="handleButtonClick"
    />
  </template>
  <VfSwitch
    v-else
    class="vf-theme-switch vf-theme-switch--switch"
    v-bind="attrs"
    :model-value="checked"
    :size="props.size"
    :disabled="props.disabled"
    :label="props.label"
    :static="props.static"
    :thumb-contrast="props.thumbContrast"
    @update:model-value="handleCheckedChange"
  >
    <template #thumb="{ checked: thumbChecked }">
      <slot name="thumb" :checked="thumbChecked">
        <VueIconify :icon="thumbChecked ? icons.moon : icons.sun" />
      </slot>
    </template>
    <template v-if="hasContent">
      <slot>{{ props.label }}</slot>
    </template>
  </VfSwitch>
</template>
