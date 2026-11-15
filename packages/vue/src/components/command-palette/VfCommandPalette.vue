<script setup lang="ts">
import { computed, useId } from 'vue';
import { useVfModalPortal } from '../modal/modal-portal';
import CmCommandPalette from './CmCommandPalette.vue';
import type { CmCommandPaletteItem, VfCommandPaletteProps } from './command-palette.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfCommandPaletteProps>(), {
  open: undefined,
  title: 'Search',
  placeholder: 'Search...',
  defaultValue: '',
  items: () => [],
  idleText: 'Start typing to search',
  emptyText: 'Nothing found',
  highlightMatches: true,
  dividers: true,
  closeOnSelect: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  showDefaultFooterHints: true,
  teleportTo: 'body',
});
const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:modelValue': [value: string];
  openChange: [open: boolean];
  queryChange: [query: string];
  select: [item: unknown];
  submit: [query: string];
  open: [];
  close: [];
}>();
const fallbackId = useId();
const { target } = useVfModalPortal(
  () => props.teleportTo,
  () => props.disableTeleport,
);

function textField(item: unknown, keys: readonly string[]): string {
  if (item === null || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function resultLabel(item: unknown, index: number): string {
  const field = textField(item, ['title', 'label', 'value', 'name']);
  if (field) return field;
  if (typeof item === 'string' && item.trim()) return item;
  if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') return String(item);
  return `Item ${index + 1}`;
}

const results = computed(() =>
  props.items.map((item, index) => ({
    item,
    index,
    command: {
      id: `result-${index}`,
      label: resultLabel(item, index),
      disabled: Boolean(item && typeof item === 'object' && (item as Record<string, unknown>).disabled === true),
    },
    breadcrumb: textField(item, ['breadcrumb', 'section', 'path', 'group', 'category']),
    snippet: textField(item, ['snippet', 'description', 'text', 'content', 'summary']),
  })),
);
const commands = computed(() => results.value.map(({ command }) => command));
const byId = computed(() => new Map(results.value.map((result) => [result.command.id, result])));
const resultFor = (command: CmCommandPaletteItem) => byId.value.get(command.id)!;

function highlighted(text: string, query: string): { text: string; match: boolean }[] {
  const needle = query.trim();
  if (!props.highlightMatches || !needle) return [{ text, match: false }];
  const literal = needle.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return text.split(new RegExp(`(${literal})`, 'giu')).map((part, index) => ({ text: part, match: index % 2 === 1 }));
}

function selectItem(item: unknown, close: () => void): void {
  emit('select', item);
  if (props.closeOnSelect) close();
}
</script>

<template>
  <Teleport :to="target ?? 'body'" :disabled="!target">
    <CmCommandPalette
      v-bind="$attrs"
      :id="props.id ?? fallbackId"
      ref="modal"
      :title="props.title"
      :commands="commands"
      :open="props.open"
      :default-open="props.defaultOpen"
      :query="props.modelValue"
      :default-query="props.defaultValue"
      :placeholder="props.placeholder"
      :loading="props.loading"
      :idle-text="props.idleText"
      :empty-text="props.emptyText"
      :filter="false"
      :auto-activate="false"
      :dividers="props.dividers"
      :max-height="props.maxHeight"
      :close-on-select="props.closeOnSelect"
      :close-on-overlay-click="props.closeOnOverlayClick"
      :close-on-escape="props.closeOnEscape"
      @update:open="emit('update:open', $event)"
      @open-change="emit('openChange', $event)"
      @update:query="emit('update:modelValue', $event)"
      @query-change="emit('queryChange', $event)"
      @select="emit('select', byId.get($event)?.item)"
      @submit="emit('submit', $event)"
      @open="emit('open')"
      @close="emit('close')"
    >
      <template v-if="$slots.actions" #actions="scope"><slot name="actions" v-bind="scope" /></template>
      <template v-if="$slots.default" #results="{ query, loading: busy, activeIndex, close }">
        <slot
          :items="props.items"
          :query="query"
          :loading="busy"
          :active-index="activeIndex"
          :select="(item: unknown) => selectItem(item, close)"
          :close="close"
        />
      </template>
      <template #item="{ command, active, query, select }">
        <slot
          name="item"
          :item="resultFor(command).item"
          :index="resultFor(command).index"
          :active="active"
          :query="query"
          :select="select"
        >
          <span class="cm-command-palette__result">
            <span
              v-for="(text, index) in [resultFor(command).breadcrumb, command.label, resultFor(command).snippet]"
              v-show="text"
              :key="index"
              :class="index === 1 ? undefined : 'cm-command-palette__result-context'"
            >
              <template v-for="(part, offset) in highlighted(text, query)" :key="offset">
                <mark v-if="part.match" class="cm-command-palette__match">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </span>
        </slot>
      </template>
      <template v-if="$slots.empty" #empty="scope"><slot name="empty" v-bind="scope" /></template>
      <template v-if="$slots.footer || props.showDefaultFooterHints" #footer="{ query, close }">
        <slot name="footer" :query="query" :close="close" :items="props.items">
          <span class="cm-command-palette__hints" aria-label="Keyboard shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span v-if="props.closeOnEscape"><kbd>Esc</kbd> Close</span>
          </span>
        </slot>
      </template>
    </CmCommandPalette>
  </Teleport>
</template>
