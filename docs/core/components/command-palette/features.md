# Features

Search command overlay with keyboard navigation and item selection.

## Import

Import statement for this component.

```ts
import { VfCommandPalette } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 520
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:var(--vf-surface-gap)">
    <VfButton @click="open = true">Open Command Palette</VfButton>
    <div style="font-size:var(--vf-text-caption-font-size);color:var(--vf-color-muted)">
      Selected: <strong>{{ selected || 'none' }}</strong>
    </div>

    <VfCommandPalette
      v-model:open="open"
      v-model="query"
      title="Search docs"
      :disable-teleport="true"
      :items="filteredItems"
      @select="handleSelect"
      @submit="handleSubmit"
    >
      <template #item="{ item, active, select }">
        <VfButton
          variant="ghost"
          style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:var(--vf-surface-gap-compact) var(--vf-surface-gap);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control);background:var(--vf-color-surface);cursor:pointer"
          :style="active ? 'border-color:var(--vf-color-border);background:var(--vf-color-surface)' : ''"
          @click="select(item)"
        >
          <span>{{ item }}</span>
          <span style="font-size:var(--vf-text-label-font-size);color:var(--vf-color-muted)">Enter</span>
        </VfButton>
      </template>

      <template #footer>
        <div style="display:flex;gap:var(--vf-surface-gap-compact);font-size:var(--vf-text-caption-font-size);color:var(--vf-color-muted)">
          <span>↑↓ navigate</span>
          <span>Enter select</span>
          <span>Esc close</span>
        </div>
      </template>
    </VfCommandPalette>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VfButton, VfCommandPalette } from '@codemonster-ru/vueforge-core';

const open = ref(true);
const query = ref('');
const selected = ref('');
const items: string[] = [];

const filteredItems = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.toLowerCase().includes(q));
});

const unlockPageScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

watch(
  open,
  (value) => {
    if (!value) return;
    requestAnimationFrame(unlockPageScroll);
  },
  { immediate: true }
);

function handleSelect(item: unknown) {
  selected.value = String(item);
}

function handleSubmit(value: string) {
  selected.value = value;
}
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Palette surface is rendered as `role="dialog"` with `aria-modal="true"` and dialog label derived from `title`.
- Result list uses `role="listbox"`; result rows use `role="option"` with `aria-selected` for active item.
- Focus moves to search input on open and is restored to previously focused element on close.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `ArrowDown` | Moves active result to next item. |
| `ArrowUp` | Moves active result to previous item. |
| `Enter` | Selects active result; if no active result, submits current query. |
| `Escape` | Closes palette when `closeOnEscape` is enabled. |
| `Tab` | Keeps focus within palette while open (focus trap). |
