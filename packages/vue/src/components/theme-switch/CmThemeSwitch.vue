<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';
import {
  cmThemeAttribute,
  cmThemeCookieName,
  isCmThemeMode,
  serializeCmThemeCookie,
  type CmThemeMode,
} from '@codemonster-ru/ui-runtime/core';

import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import type { CmThemeSwitchOption } from './theme-switch.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  cookieName: { type: String, default: cmThemeCookieName },
  legend: { type: String, default: 'Theme' },
  modelValue: { type: String as PropType<CmThemeMode | null>, default: null },
  name: { type: String, default: 'cm-theme' },
  options: {
    type: Array as PropType<readonly CmThemeSwitchOption[]>,
    default: () => [
      { label: 'Light', value: 'light' },
      { label: 'System', value: 'system' },
      { label: 'Dark', value: 'dark' },
    ],
  },
});

const emit = defineEmits<{
  'update:modelValue': [mode: CmThemeMode];
  themeChange: [mode: CmThemeMode];
}>();

useCmHydrated();
const attrs = useAttrs();
const classes = computed(() => mergeCmClasses('cm-theme-switch', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'data-cm-controller']));
const mode = computed<CmThemeMode>(() => (isCmThemeMode(props.modelValue) ? props.modelValue : 'system'));

/**
 * Writes the same attribute and cookie the controller writes, so a page that renders this component
 * behaves the same as one enhanced by `CmRuntime`. The attribute is written verbatim, `system`
 * included: the stylesheet resolves that case through a media query.
 */
function select(value: string): void {
  if (!isCmThemeMode(value)) return;

  const root = document.documentElement;
  root.setAttribute(cmThemeAttribute, value);

  try {
    document.cookie = serializeCmThemeCookie(value, {
      name: props.cookieName,
      secure: document.location.protocol === 'https:',
    });
  } catch {
    // Cookies can be unavailable in privacy-restricted contexts.
  }

  emit('update:modelValue', value);
  emit('themeChange', value);
}
</script>

<template>
  <fieldset v-bind="rootAttrs" :class="classes" data-cm-controller="theme-switch">
    <legend class="cm-theme-switch__legend">{{ props.legend }}</legend>
    <label v-for="option in props.options" :key="option.value" class="cm-theme-switch__option">
      <input
        class="cm-theme-switch__input"
        type="radio"
        :name="props.name"
        :value="option.value"
        :checked="option.value === mode"
        @change="select(option.value)"
      />
      <span class="cm-theme-switch__label">{{ option.label }}</span>
    </label>
  </fieldset>
</template>
