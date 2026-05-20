# Features

## Summary

Search command overlay with keyboard navigation and item selection.

## Import

```ts
import { VfCommandPalette } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 520
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:10px">
    <button @click="open = true">Open Command Palette</button>
    <div style="font-size:12px;color:#4b5563">
      Selected: <strong>{{ selected || 'none' }}</strong>
    </div>

    <VfCommandPalette
      v-model:open="open"
      v-model="query"
      title="Search docs"
      :items="filteredItems"
      @select="handleSelect"
      @submit="handleSubmit"
    >
      <template #item="{ item, active, select }">
        <button
          style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;background:white;cursor:pointer"
          :style="active ? 'border-color:#9ca3af;background:#f9fafb' : ''"
          @click="select(item)"
        >
          <span>{{ item }}</span>
          <span style="font-size:11px;color:#6b7280">Enter</span>
        </button>
      </template>

      <template #footer>
        <div style="display:flex;gap:8px;font-size:12px;color:#6b7280">
          <span>↑↓ navigate</span>
          <span>Enter select</span>
          <span>Esc close</span>
        </div>
      </template>
    </VfCommandPalette>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { VfCommandPalette } from '@codemonster-ru/vueforge-core';

const open = ref(true);
const query = ref('');
const selected = ref('');
const items = ['Getting Started', 'Installation', 'Configuration', 'Components', 'Theming'];

const filteredItems = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.toLowerCase().includes(q));
});

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

### Screen Reader

- Palette surface is rendered as `role="dialog"` with `aria-modal="true"` and dialog label derived from `title`.
- Result list uses `role="listbox"`; result rows use `role="option"` with `aria-selected` for active item.
- Focus moves to search input on open and is restored to previously focused element on close.

### Keyboard Support

| Key | Function |
| --- | --- |
| `ArrowDown` | Moves active result to next item. |
| `ArrowUp` | Moves active result to previous item. |
| `Enter` | Selects active result; if no active result, submits current query. |
| `Escape` | Closes palette when `closeOnEscape` is enabled. |
| `Tab` | Keeps focus within palette while open (focus trap). |

