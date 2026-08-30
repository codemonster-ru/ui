<script setup lang="ts">
import { computed, ref, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { nextAccordionItem, resolveAccordionOpenItems, toggleAccordionItem } from '@codemonster-ru/ui-runtime/core';

import { useCmHydrated } from '../../internal/hydration';
import { assertCm, warnCm } from '../../internal/warn';
import type { CmAccordionItem, CmAccordionOpenChange } from './accordion.types';

defineOptions({ inheritAttrs: false });

const itemIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const props = defineProps({
  id: { type: String, required: true },
  items: { type: Array as PropType<readonly CmAccordionItem[]>, required: true },
  openItems: { type: Array as PropType<readonly string[] | null>, default: null },
  defaultOpenItems: { type: Array as PropType<readonly string[]>, default: () => [] },
  multiple: Boolean,
});
const emit = defineEmits<{
  openChange: [detail: CmAccordionOpenChange];
  'update:openItems': [openItems: string[]];
}>();
const attrs = useAttrs();

function validatedItems(): readonly CmAccordionItem[] {
  assertCm(props.id.trim() !== '', 'Accordion id must be a non-empty string.');

  const ids = new Set<string>();
  const items: CmAccordionItem[] = [];
  for (const item of props.items) {
    if (!itemIdPattern.test(item.id) || !item.title.trim() || typeof item.content !== 'string' || ids.has(item.id)) {
      warnCm(`Invalid Accordion item: ${item.id}. The item is not rendered.`);
      continue;
    }
    ids.add(item.id);
    items.push(item);
  }
  return items;
}

const normalizedItems = computed(validatedItems);

function normalizeOpenItems(values: readonly string[]): string[] {
  return resolveAccordionOpenItems(normalizedItems.value, values, props.multiple);
}

const localOpenItems = ref(normalizeOpenItems(props.defaultOpenItems));
const renderedOpenItems = computed(() =>
  props.openItems === null ? localOpenItems.value : normalizeOpenItems(props.openItems),
);
const classes = computed(() => mergeCmClasses('cm-accordion', attrs.class));
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['data-cm-controller', 'data-cm-accordion-multiple', 'onKeydown']),
);

function isOpen(id: string): boolean {
  return renderedOpenItems.value.includes(id);
}

function itemSlotName(region: 'trigger' | 'panel', id: string): string {
  return `${region}${id
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
}

function toggle(item: CmAccordionItem): void {
  if (item.disabled) return;

  const next = toggleAccordionItem(normalizedItems.value, renderedOpenItems.value, item.id, props.multiple);

  if (props.openItems === null) localOpenItems.value = next;
  emit('update:openItems', next);
  emit('openChange', { openItems: next });
}

function moveFocus(event: KeyboardEvent): void {
  const root = event.currentTarget as HTMLElement;
  const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>('.cm-accordion__trigger');
  const currentId = trigger?.closest<HTMLElement>('[data-cm-accordion-item]')?.dataset.cmAccordionItem;
  if (currentId === undefined) return;

  const nextId = nextAccordionItem(normalizedItems.value, currentId, event.key);
  if (nextId === null) return;

  event.preventDefault();
  root.querySelector<HTMLButtonElement>(`[data-cm-accordion-item="${nextId}"] .cm-accordion__trigger`)?.focus();
}

useCmHydrated();
</script>

<template>
  <div
    v-bind="rootAttrs"
    :class="classes"
    data-cm-controller="accordion"
    :data-cm-accordion-multiple="props.multiple ? 'true' : undefined"
    @keydown="moveFocus"
  >
    <section
      v-for="item in normalizedItems"
      :key="item.id"
      class="cm-accordion__item"
      :data-cm-accordion-item="item.id"
    >
      <h3 class="cm-accordion__heading">
        <button
          :id="`${props.id}-${item.id}-trigger`"
          class="cm-accordion__trigger"
          type="button"
          :aria-expanded="isOpen(item.id)"
          :aria-controls="`${props.id}-${item.id}-panel`"
          :disabled="item.disabled || undefined"
          @click="toggle(item)"
        >
          <slot :name="itemSlotName('trigger', item.id)" :item="item" :open="isOpen(item.id)">
            {{ item.title }}
          </slot>
        </button>
      </h3>
      <div
        :id="`${props.id}-${item.id}-panel`"
        class="cm-accordion__panel"
        role="region"
        :aria-labelledby="`${props.id}-${item.id}-trigger`"
        :hidden="!isOpen(item.id)"
      >
        <slot :name="itemSlotName('panel', item.id)" :item="item" :open="isOpen(item.id)">
          {{ item.content }}
        </slot>
      </div>
    </section>
  </div>
</template>
