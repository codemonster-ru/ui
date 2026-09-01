<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';

// AdminShell holds no state at all, so it needs neither attributes nor a controller: it is the
// frame, and everything that changes lives in what fills it.
defineOptions({ inheritAttrs: false });
const props = defineProps({ as: { type: String, default: 'div' } });
const attrs = useAttrs();
const slots = useSlots();
const hasTopbar = computed(() => Boolean(slots.brand || slots.header || slots.headerActions));
</script>

<template>
  <component :is="props.as" v-bind="attrs" class="cm-admin-shell">
    <header v-if="hasTopbar" class="cm-admin-shell__topbar">
      <div v-if="$slots.brand" class="cm-admin-shell__brand"><slot name="brand" /></div>
      <div v-if="$slots.header" class="cm-admin-shell__header"><slot name="header" /></div>
      <div v-if="$slots.headerActions" class="cm-admin-shell__header-actions"><slot name="headerActions" /></div>
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
