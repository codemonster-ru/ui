<script setup lang="ts">
import { createCmShellMetricsController } from '@codemonster-ru/ui-runtime';
import { computed, useAttrs, useSlots, useTemplateRef, watchPostEffect } from 'vue';

import type { CmAdminShellProps } from './admin-shell.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CmAdminShellProps>(), { as: 'div', fillViewport: true });
const attrs = useAttrs();
const slots = useSlots();
const hasTopbar = computed(() =>
  Boolean(slots.brand || slots.header || slots.headerActions || slots['header-actions']),
);
const root = useTemplateRef<HTMLElement>('root');
watchPostEffect((onCleanup) => {
  if (!root.value || !hasTopbar.value) return;
  const controller = createCmShellMetricsController(root.value);
  controller.connect();
  onCleanup(() => controller.disconnect());
});
</script>

<template>
  <component
    :is="props.as"
    ref="root"
    v-bind="attrs"
    class="cm-admin-shell"
    :class="{ 'cm-admin-shell--fit-content': !fillViewport }"
  >
    <header v-if="hasTopbar" class="cm-admin-shell__topbar">
      <div v-if="$slots.brand" class="cm-admin-shell__brand"><slot name="brand" /></div>
      <div v-if="$slots.header" class="cm-admin-shell__header"><slot name="header" /></div>
      <div v-if="slots.headerActions || slots['header-actions']" class="cm-admin-shell__header-actions">
        <slot name="header-actions"><slot name="headerActions" /></slot>
      </div>
    </header>
    <div class="cm-admin-shell__body">
      <aside v-if="$slots.sidebar" class="cm-admin-shell__sidebar">
        <div class="cm-admin-shell__sidebar-content"><slot name="sidebar" /></div>
      </aside>
      <div class="cm-admin-shell__workspace">
        <main class="cm-admin-shell__content"><slot /></main>
        <footer v-if="$slots.footer" class="cm-admin-shell__footer"><slot name="footer" /></footer>
      </div>
    </div>
  </component>
</template>
