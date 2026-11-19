<script setup lang="ts">
import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';
import { CmButton, CmLink, CmTag, VfThemeSwitch } from '@codemonster-ru/ui-vue';

defineProps<{
  mode: CmThemeMode;
  resolved: 'light' | 'dark';
}>();

const emit = defineEmits<{
  select: [mode: CmThemeMode];
  toggle: [];
}>();

const modes = ['light', 'dark', 'system'] as const;
const buttonVariants = ['secondary', 'ghost', 'secondary'] as const;
</script>

<template>
  <section id="theme" class="showcase-group" tabindex="-1">
    <header class="showcase-group-heading">
      <h2>Theme</h2>
      <CmLink href="/colors/" underline="hover">Colors and contrast</CmLink>
    </header>
    <div class="core-theme-grid">
      <article class="cm-panel showcase-panel core-theme-card">
        <h3>Theme provider</h3>
        <div class="core-theme-controls">
          <CmButton
            v-for="option in modes"
            :key="option"
            size="sm"
            variant="secondary"
            :aria-pressed="mode === option"
            @click="emit('select', option)"
            >{{ option[0].toUpperCase() + option.slice(1) }}</CmButton
          >
          <CmButton size="sm" @click="emit('toggle')">Toggle</CmButton>
        </div>
        <div class="core-theme-controls core-theme-status" aria-live="polite">
          <CmTag tone="primary">mode: {{ mode }}</CmTag>
          <CmTag tone="contrast">resolved: {{ resolved }}</CmTag>
        </div>
      </article>
      <article class="cm-panel showcase-panel core-theme-card">
        <h3>Theme switch</h3>
        <div class="core-theme-controls">
          <VfThemeSwitch />
          <VfThemeSwitch static />
          <VfThemeSwitch static thumb-contrast="inverse" />
          <VfThemeSwitch
            v-for="(variant, index) in buttonVariants"
            :key="index"
            :size="index === 2 ? 'sm' : 'md'"
            variant="button"
            :button-variant="variant"
          />
          <VfThemeSwitch
            v-for="(variant, index) in buttonVariants"
            :key="'labeled-' + index"
            :size="index === 2 ? 'lg' : 'md'"
            variant="button"
            :button-variant="variant"
            :label="resolved === 'dark' ? 'Dark' : 'Light'"
          />
        </div>
        <p class="showcase-muted core-theme-switch-note">Toggling from System chooses Light or Dark explicitly.</p>
      </article>
    </div>
  </section>
</template>
