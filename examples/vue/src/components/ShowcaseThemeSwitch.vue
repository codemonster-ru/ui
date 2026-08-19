<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots } from 'vue';
import { CmButton, CmIconButton, CmSwitch } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/switch.css';

import { useShowcaseTheme } from '../showcase-theme';

type ThemeSwitchAppearance = 'switch' | 'icon-button' | 'button';
type ThemeSwitchButtonTone = 'secondary' | 'ghost';
type ThemeSwitchSize = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    appearance?: ThemeSwitchAppearance;
    buttonTone?: ThemeSwitchButtonTone;
    size?: ThemeSwitchSize;
    disabled?: boolean;
    label?: string;
    staticTrack?: boolean;
    inverseThumb?: boolean;
  }>(),
  {
    appearance: 'switch',
    buttonTone: 'secondary',
    size: 'md',
    disabled: false,
    label: undefined,
    staticTrack: false,
    inverseThumb: false,
  },
);

const slots = useSlots();
const { resolvedTheme, setThemeMode } = useShowcaseTheme();
const checked = computed(() => resolvedTheme.value === 'dark');
const hasContent = computed(() => Boolean(props.label || slots.default));
const iconName = computed(() => (checked.value ? icons.moon : icons.sun));
const iconSize = computed(() => `var(--cm-icon-size-${props.size})`);
const nextThemeLabel = computed(() => (checked.value ? 'Switch to light theme' : 'Switch to dark theme'));
const pendingTheme = ref<number | null>(null);

function scheduleTheme(value: boolean): void {
  if (pendingTheme.value !== null) window.cancelAnimationFrame(pendingTheme.value);
  pendingTheme.value = window.requestAnimationFrame(() => {
    setThemeMode(value ? 'dark' : 'light');
    pendingTheme.value = null;
  });
}

onBeforeUnmount(() => {
  if (pendingTheme.value !== null) window.cancelAnimationFrame(pendingTheme.value);
});
</script>

<template>
  <CmButton
    v-if="props.appearance === 'button'"
    class="showcase-theme-switch"
    :variant="props.buttonTone"
    :size="props.size"
    :disabled="props.disabled"
    :aria-label="nextThemeLabel"
    @click="scheduleTheme(!checked)"
  >
    <template #leading><VueIconify :icon="iconName" :size="iconSize" aria-hidden="true" /></template>
    <slot>{{ props.label }}</slot>
  </CmButton>
  <CmIconButton
    v-else-if="props.appearance === 'icon-button'"
    class="showcase-theme-switch"
    :variant="props.buttonTone"
    :size="props.size"
    :disabled="props.disabled"
    :label="nextThemeLabel"
    @click="scheduleTheme(!checked)"
  >
    <VueIconify :icon="iconName" :size="iconSize" />
  </CmIconButton>
  <CmSwitch
    v-else
    class="showcase-theme-switch"
    :class="{
      'showcase-theme-switch--static-track': props.staticTrack,
      'showcase-theme-switch--inverse-thumb': props.inverseThumb,
    }"
    :model-value="checked"
    :size="props.size"
    :disabled="props.disabled"
    :label="props.label"
    :aria-label="hasContent ? undefined : nextThemeLabel"
    @update:model-value="scheduleTheme"
  >
    <template #thumb="{ checked: thumbChecked }">
      <VueIconify :icon="thumbChecked ? icons.moon : icons.sun" size="100%" />
    </template>
    <template v-if="hasContent"
      ><slot>{{ props.label }}</slot></template
    >
  </CmSwitch>
</template>

<style>
/* stylelint-disable no-descending-specificity -- Route-owned switch states must outrank canonical checked states. */
.showcase-theme-switch--static-track .cm-switch__control,
.showcase-theme-switch--static-track .cm-switch__input:checked + .cm-switch__control,
.showcase-theme-switch--static-track:hover .cm-switch__control,
.showcase-theme-switch--static-track:active .cm-switch__control {
  border-color: var(--cm-color-border-interactive);
  background: var(--cm-color-background-surface);
}

.showcase-theme-switch--static-track .cm-switch__input:checked + .cm-switch__control .cm-switch__thumb {
  border-color: var(--cm-color-icon-secondary);
  background: var(--cm-color-icon-secondary);
  color: var(--cm-color-icon-inverse);
}

.showcase-theme-switch--inverse-thumb .cm-switch__thumb,
.showcase-theme-switch--inverse-thumb .cm-switch__input:checked + .cm-switch__control .cm-switch__thumb {
  border-color: var(--cm-color-border-inverse);
  background: var(--cm-color-background-inverse);
  color: var(--cm-color-icon-inverse);
}
/* stylelint-enable no-descending-specificity */
</style>
