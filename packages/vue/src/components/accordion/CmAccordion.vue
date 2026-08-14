<script setup lang="ts">
import { computed, ref, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
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
  if (!props.id.trim()) {
    throw new TypeError('Accordion id must be a non-empty string.');
  }

  const ids = new Set<string>();
  for (const item of props.items) {
    if (!itemIdPattern.test(item.id) || !item.title.trim() || typeof item.content !== 'string' || ids.has(item.id)) {
      throw new TypeError(`Invalid Accordion item: ${item.id}.`);
    }
    ids.add(item.id);
  }
  return props.items;
}

const normalizedItems = computed(validatedItems);

function normalizeOpenItems(values: readonly string[]): string[] {
  const requested = new Set(values);
  const normalized = normalizedItems.value
    .filter((item) => !item.disabled && requested.has(item.id))
    .map(({ id }) => id);
  return props.multiple ? normalized : normalized.slice(0, 1);
}

const localOpenItems = ref(normalizeOpenItems(props.defaultOpenItems));
const renderedOpenItems = computed(() =>
  props.openItems === null ? localOpenItems.value : normalizeOpenItems(props.openItems),
);
const classes = computed(() => mergeCmClasses('cm-accordion', attrs.class as CmClassValue));
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

  const open = isOpen(item.id);
  const requested = props.multiple
    ? open
      ? renderedOpenItems.value.filter((id) => id !== item.id)
      : [...renderedOpenItems.value, item.id]
    : open
      ? []
      : [item.id];
  const next = normalizeOpenItems(requested);

  if (props.openItems === null) localOpenItems.value = next;
  emit('update:openItems', next);
  emit('openChange', { openItems: next });
}

function moveFocus(event: KeyboardEvent): void {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

  const root = event.currentTarget as HTMLElement;
  const enabled = [...root.querySelectorAll<HTMLButtonElement>('.cm-accordion__trigger:not(:disabled)')];
  const currentIndex = enabled.indexOf(event.target as HTMLButtonElement);
  if (currentIndex < 0) return;

  event.preventDefault();
  const lastIndex = enabled.length - 1;
  const nextIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? lastIndex
        : event.key === 'ArrowDown'
          ? (currentIndex + 1) % enabled.length
          : (currentIndex - 1 + enabled.length) % enabled.length;
  enabled[nextIndex]?.focus();
}
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
