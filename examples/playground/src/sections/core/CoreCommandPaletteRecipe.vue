<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { CmBadge, CmDialog, CmInput } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/badge.css';
import '@codemonster-ru/ui-css/dialog.css';
import '@codemonster-ru/ui-css/input.css';

export interface CoreCommandPaletteRecipeItem {
  title: string;
  label: string;
  section: string;
  snippet: string;
  type: string;
}

const props = withDefaults(
  defineProps<{
    open?: boolean;
    modelValue?: string;
    title?: string;
    placeholder?: string;
    items: readonly CoreCommandPaletteRecipeItem[];
    idleText?: string;
    emptyText?: string;
  }>(),
  {
    open: false,
    modelValue: '',
    title: 'Search Documentation',
    placeholder: 'Search components, guides, and API...',
    idleText: 'Start typing to search',
    emptyText: 'Nothing found',
  },
);

const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:modelValue': [query: string];
  select: [item: CoreCommandPaletteRecipeItem];
}>();

const contentRef = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);
const normalizedQuery = computed(() => props.modelValue.trim().toLocaleLowerCase());
const visibleItems = computed(() => {
  if (!normalizedQuery.value) return [];

  return props.items.filter((item) =>
    [item.label, item.section, item.snippet, item.type].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery.value),
    ),
  );
});
const activeOptionId = computed(() =>
  activeIndex.value >= 0 ? `core-command-palette-option-${activeIndex.value}` : undefined,
);

function requestOpenChange(open: boolean): void {
  emit('update:open', open);
}

function updateQuery(query: string): void {
  emit('update:modelValue', query);
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) requestOpenChange(false);
}

function moveActiveIndex(direction: 1 | -1): void {
  if (visibleItems.value.length === 0) {
    activeIndex.value = -1;
    return;
  }

  if (activeIndex.value < 0) {
    activeIndex.value = direction > 0 ? 0 : visibleItems.value.length - 1;
    return;
  }

  activeIndex.value = (activeIndex.value + direction + visibleItems.value.length) % visibleItems.value.length;
}

function selectItem(item: CoreCommandPaletteRecipeItem): void {
  emit('select', item);
  requestOpenChange(false);
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    if (visibleItems.value.length === 0) return;
    event.preventDefault();
    activeIndex.value = event.key === 'Home' ? 0 : visibleItems.value.length - 1;
    return;
  }

  if (event.key === 'Enter' && activeIndex.value >= 0) {
    const item = visibleItems.value[activeIndex.value];
    if (!item) return;
    event.preventDefault();
    selectItem(item);
  }
}

function highlightedParts(value: string): Array<{ text: string; match: boolean }> {
  const needle = props.modelValue.trim();
  if (!needle) return [{ text: value, match: false }];
  const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(escapedNeedle, 'igu');
  const parts: Array<{ text: string; match: boolean }> = [];
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index;
    if (index > lastIndex) parts.push({ text: value.slice(lastIndex, index), match: false });
    parts.push({ text: match[0], match: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex), match: false });
  return parts.length > 0 ? parts : [{ text: value, match: false }];
}

watch(
  () => props.modelValue,
  () => {
    activeIndex.value = -1;
  },
);

watch(
  () => props.open,
  async (open) => {
    activeIndex.value = -1;
    if (!open) return;
    await nextTick();
    contentRef.value?.querySelector<HTMLInputElement>('input')?.select();
  },
);
</script>

<template>
  <CmDialog
    id="core-command-palette"
    class="core-command-palette-recipe"
    :open="props.open"
    :title="props.title"
    close-label="Close search"
    size="lg"
    @click="handleBackdropClick"
    @update:open="requestOpenChange"
  >
    <div ref="contentRef" class="core-command-palette-recipe__content">
      <header class="core-command-palette-recipe__search">
        <CmInput
          class="core-command-palette-recipe__input"
          type="search"
          :model-value="props.modelValue"
          :placeholder="props.placeholder"
          clearable
          clear-label="Clear search"
          role="combobox"
          autocomplete="off"
          :spellcheck="false"
          :aria-expanded="props.open"
          :aria-controls="visibleItems.length > 0 ? 'core-command-palette-listbox' : undefined"
          :aria-activedescendant="activeOptionId"
          autofocus
          @keydown="handleInputKeydown"
          @update:model-value="updateQuery"
        >
          <template #leading>
            <VueIconify :icon="icons.magnifyingGlass" size="var(--cm-icon-size-md)" />
          </template>
        </CmInput>
      </header>

      <div class="core-command-palette-recipe__body">
        <ul
          v-if="visibleItems.length > 0"
          id="core-command-palette-listbox"
          class="core-command-palette-recipe__list"
          role="listbox"
          aria-label="Search results"
        >
          <li v-for="(item, index) in visibleItems" :key="item.title" role="presentation">
            <button
              :id="`core-command-palette-option-${index}`"
              class="core-command-palette-recipe__item"
              :class="index === activeIndex && 'core-command-palette-recipe__item--active'"
              type="button"
              role="option"
              tabindex="-1"
              :aria-selected="index === activeIndex"
              @mousemove="activeIndex = index"
              @click="selectItem(item)"
            >
              <span class="core-command-palette-recipe__item-layout">
                <span class="core-command-palette-recipe__item-content">
                  <span class="core-command-palette-recipe__item-breadcrumb">
                    <span
                      v-for="(part, partIndex) in highlightedParts(item.section)"
                      :key="`breadcrumb-${partIndex}`"
                      :class="part.match && 'core-command-palette-recipe__item-match'"
                    >{{ part.text }}</span>
                  </span>
                  <span class="core-command-palette-recipe__item-title">
                    <span class="core-command-palette-recipe__item-leading-icon" aria-hidden="true">
                      <VueIconify :icon="icons.file" size="var(--cm-icon-size-md)" />
                    </span>
                    <span
                      v-for="(part, partIndex) in highlightedParts(item.title)"
                      :key="`title-${partIndex}`"
                      :class="part.match && 'core-command-palette-recipe__item-match'"
                    >{{ part.text }}</span>
                  </span>
                  <span class="core-command-palette-recipe__item-snippet">
                    <span
                      v-for="(part, partIndex) in highlightedParts(item.snippet)"
                      :key="`snippet-${partIndex}`"
                      :class="part.match && 'core-command-palette-recipe__item-match'"
                    >{{ part.text }}</span>
                  </span>
                </span>
                <span class="core-command-palette-recipe__item-enter" aria-hidden="true">
                  <VueIconify :icon="icons.arrowTurnUpLeft" size="var(--cm-icon-size-md)" />
                </span>
              </span>
            </button>
          </li>
        </ul>
        <div
          v-else-if="normalizedQuery"
          class="core-command-palette-recipe__status"
          role="status"
          aria-live="polite"
        >
          {{ props.emptyText }}
        </div>
        <p v-else class="core-command-palette-recipe__status" role="status" aria-live="polite">
          {{ props.idleText }}
        </p>
      </div>

      <footer class="core-command-palette-recipe__footer">
        <div class="core-command-palette-recipe__hints" aria-label="Keyboard shortcuts">
          <span class="core-command-palette-recipe__hint">
            <span class="core-command-palette-recipe__hint-keys" aria-hidden="true">
              <CmBadge class="core-command-palette-recipe__hint-key core-command-palette-recipe__hint-key--icon">
                <VueIconify :icon="icons.arrowUp" size="var(--cm-icon-size-sm)" />
              </CmBadge>
              <CmBadge class="core-command-palette-recipe__hint-key core-command-palette-recipe__hint-key--icon">
                <VueIconify :icon="icons.arrowDown" size="var(--cm-icon-size-sm)" />
              </CmBadge>
            </span>
            <span class="core-command-palette-recipe__hint-label">Navigate</span>
          </span>
          <span class="core-command-palette-recipe__hint">
            <CmBadge
              class="core-command-palette-recipe__hint-key core-command-palette-recipe__hint-key--icon"
              aria-hidden="true"
            >
              <VueIconify :icon="icons.arrowTurnUpLeft" size="var(--cm-icon-size-sm)" />
            </CmBadge>
            <span class="core-command-palette-recipe__hint-label">Select</span>
          </span>
          <span class="core-command-palette-recipe__hint">
            <CmBadge class="core-command-palette-recipe__hint-key" aria-hidden="true">Esc</CmBadge>
            <span class="core-command-palette-recipe__hint-label">Close</span>
          </span>
        </div>
      </footer>
    </div>
  </CmDialog>
</template>

<style scoped>
:deep(.core-command-palette-recipe.cm-dialog) {
  inset-block: calc(var(--cm-space-4) + var(--cm-control-height-sm)) auto;
  max-block-size: min(
    85vh,
    calc(var(--cm-space-16) * 12),
    calc(100dvh - var(--cm-control-height-sm) - var(--cm-space-8))
  );
  margin-block: 0;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
}

:deep(.core-command-palette-recipe > .cm-dialog__surface) {
  max-block-size: inherit;
}

:deep(.core-command-palette-recipe > .cm-dialog__surface > .cm-dialog__header) {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  min-block-size: 0;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
}

:deep(.core-command-palette-recipe > .cm-dialog__surface > .cm-dialog__header .cm-dialog__close) {
  display: none;
}

:deep(.core-command-palette-recipe > .cm-dialog__surface > .cm-dialog__body) {
  display: flex;
  padding: 0;
  overflow: hidden;
}

.core-command-palette-recipe__content {
  display: flex;
  min-inline-size: 0;
  flex: 1;
  flex-direction: column;
}

.core-command-palette-recipe__search {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--cm-space-4);
}

.core-command-palette-recipe__search::after {
  position: absolute;
  inset-block-end: 0;
  inset-inline: var(--cm-space-4);
  border-block-end: var(--cm-border-width) solid var(--cm-color-border-divider);
  content: '';
}

.core-command-palette-recipe__input {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.core-command-palette-recipe__body {
  min-block-size: 0;
  flex: 1 1 auto;
  overflow: auto;
  padding: var(--cm-space-4);
}

.core-command-palette-recipe__list {
  display: grid;
  gap: var(--cm-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.core-command-palette-recipe__item {
  display: block;
  inline-size: 100%;
  min-block-size: var(--cm-control-height-md);
  padding: var(--cm-field-padding-md);
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--cm-control-font-size-md);
  line-height: var(--cm-line-height-normal);
  text-align: start;
}

.core-command-palette-recipe__item-layout {
  display: flex;
  align-items: center;
  gap: var(--cm-space-1);
  min-inline-size: 0;
}

.core-command-palette-recipe__item-content {
  display: grid;
  gap: calc(var(--cm-space-1) * 0.75);
  min-inline-size: 0;
}

.core-command-palette-recipe__item-breadcrumb,
.core-command-palette-recipe__item-title,
.core-command-palette-recipe__item-snippet {
  display: block;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.core-command-palette-recipe__item-breadcrumb {
  font-size: var(--cm-control-font-size-sm);
  line-height: var(--cm-line-height-tight);
  white-space: nowrap;
}

.core-command-palette-recipe__item-title {
  color: var(--cm-color-text-primary);
  font-family: var(--cm-font-family-heading);
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-semibold);
  line-height: var(--cm-line-height-normal);
  white-space: nowrap;
}

.core-command-palette-recipe__item-leading-icon {
  display: inline-flex;
  margin-inline-end: var(--cm-space-1);
  color: currentcolor;
  line-height: 1;
  vertical-align: text-bottom;
  transform: translateY(calc(var(--cm-focus-ring-width) / -3));
}

.core-command-palette-recipe__item-snippet {
  display: -webkit-box;
  color: var(--cm-color-text-secondary);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.core-command-palette-recipe__item-enter {
  display: inline-flex;
  flex: 0 0 auto;
  align-self: center;
  margin-inline-start: auto;
  color: inherit;
  line-height: 1;
  opacity: 0;
  pointer-events: none;
}

.core-command-palette-recipe__item:hover,
.core-command-palette-recipe__item--active {
  background: var(--cm-color-background-surface-selected);
  color: var(--cm-color-selected-foreground);
}

.core-command-palette-recipe__item:is(:hover, .core-command-palette-recipe__item--active)
  :is(
    .core-command-palette-recipe__item-title,
    .core-command-palette-recipe__item-breadcrumb,
    .core-command-palette-recipe__item-snippet
  ) {
  color: inherit;
}

.core-command-palette-recipe__item:is(:hover, .core-command-palette-recipe__item--active)
  .core-command-palette-recipe__item-enter {
  opacity: 1;
}

.core-command-palette-recipe__item:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.core-command-palette-recipe__item-match {
  color: var(--cm-color-text-primary);
  font-weight: var(--cm-font-weight-semibold);
  text-decoration: underline;
  text-decoration-color: currentcolor;
  text-underline-offset: var(--cm-text-link-underline-offset);
}

.core-command-palette-recipe__status {
  margin: 0;
  padding: 0;
  color: var(--cm-color-text-secondary);
}

.core-command-palette-recipe__footer {
  position: relative;
  display: flex;
  align-items: center;
  min-block-size: var(--cm-space-16);
  padding: var(--cm-space-4);
}

.core-command-palette-recipe__footer::before {
  position: absolute;
  inset-block-start: 0;
  inset-inline: var(--cm-space-4);
  border-block-start: var(--cm-border-width) solid var(--cm-color-border-divider);
  content: '';
}

.core-command-palette-recipe__hints {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cm-space-3);
}

.core-command-palette-recipe__hint,
.core-command-palette-recipe__hint-keys {
  display: inline-flex;
  align-items: center;
}

.core-command-palette-recipe__hint {
  gap: calc(var(--cm-space-2) * 0.75);
}

.core-command-palette-recipe__hint-keys {
  gap: var(--cm-space-1);
}

.core-command-palette-recipe__hint-key {
  justify-content: center;
  color: var(--cm-color-text-secondary);
  line-height: 1;
  pointer-events: none;
}

.core-command-palette-recipe__hint-key--icon {
  padding-inline: calc(var(--cm-space-1) / 2);
}

.core-command-palette-recipe__hint-label {
  color: var(--cm-color-text-secondary);
  font-size: var(--cm-control-font-size-sm);
  line-height: var(--cm-line-height-tight);
}

@media (width < 48rem) {
  .core-command-palette-recipe__item-snippet {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.core-command-palette-recipe),
  :deep(.core-command-palette-recipe *) {
    transition-duration: 0.01ms !important;
  }
}
</style>
