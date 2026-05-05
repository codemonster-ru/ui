<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch, type CSSProperties } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import VfBadge from '@/components/badge/VfBadge.vue';
import VfInput from '@/components/input/VfInput.vue';
import { cx } from '@/utils/classes';
import { useDisclosure, useEscapeKey, useFocusTrap } from '@/composables';
import { useBreakpoint, useScrollLock } from '@/foundation';
import { vfMotionDurationsMs } from '@/theme/motion';

defineOptions({
  inheritAttrs: false,
});

interface VfCommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  placeholder?: string;
  modelValue?: string;
  defaultValue?: string;
  items?: unknown[];
  loading?: boolean;
  idleText?: string;
  emptyText?: string;
  highlightMatches?: boolean;
  dividers?: boolean;
  closeOnSelect?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  maxHeight?: string | number;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  showDefaultFooterHints?: boolean;
}

const props = withDefaults(defineProps<VfCommandPaletteProps>(), {
  open: undefined,
  defaultOpen: false,
  title: 'Search',
  placeholder: 'Search...',
  modelValue: undefined,
  defaultValue: '',
  items: () => [],
  loading: false,
  idleText: 'Start typing to search',
  emptyText: 'Nothing found',
  highlightMatches: true,
  dividers: true,
  closeOnSelect: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  maxHeight: undefined,
  teleportTo: undefined,
  disableTeleport: false,
  showDefaultFooterHints: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
  'update:modelValue': [value: string];
  queryChange: [value: string];
  select: [item: unknown];
  submit: [query: string];
  close: [];
  open: [];
}>();

const attrs = useAttrs();
const contentRef = ref<HTMLElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);
const pointerNavigationEnabled = ref(true);
const pointerResetPending = ref(false);
const lastPointerClientX = ref<number | null>(null);
const lastPointerClientY = ref<number | null>(null);
const isBelowMd = useBreakpoint('md', { direction: 'max' });
const uncontrolledQuery = ref(props.defaultValue);

const disclosure = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: computed(() => props.open),
  onOpenChange: (value) => {
    emit('update:open', value);
    emit('openChange', value);
  },
});

const isOpen = disclosure.isOpen;
const itemsCount = computed(() => props.items.length);

const isQueryControlled = computed(() => props.modelValue !== undefined);
const query = computed({
  get: () => (isQueryControlled.value ? (props.modelValue ?? '') : uncontrolledQuery.value),
  set: (value: string) => {
    if (!isQueryControlled.value) {
      uncontrolledQuery.value = value;
    }

    emit('update:modelValue', value);
    emit('queryChange', value);
  },
});
const hasQuery = computed(() => query.value.trim().length > 0);

const transitionDuration = {
  enter: vfMotionDurationsMs.fast,
  leave: vfMotionDurationsMs.fast,
} as const;

const teleportDisabled = computed(
  () => props.disableTeleport || props.teleportTo === false || props.teleportTo === null,
);

const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') {
    return props.teleportTo;
  }

  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) {
    return props.teleportTo;
  }

  return 'body';
});

function normalizeCssLength(value: string | number | undefined): string | undefined {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
}

const contentStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  const maxHeight = normalizeCssLength(props.maxHeight);

  if (maxHeight != null) {
    style['--vf-command-palette-max-height'] = maxHeight;
  }

  return style;
});

const contentClasses = computed(() =>
  cx('vf-command-palette__content', props.dividers && 'vf-command-palette__content--dividers'),
);
const rootClasses = computed(() =>
  cx(
    'vf-command-palette',
    isBelowMd.value && 'vf-command-palette--below-md',
    !pointerNavigationEnabled.value && 'vf-command-palette--keyboard-nav',
  ),
);
const rootAttrs = computed(() => {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'));
});

function close() {
  disclosure.close();
}

function handleOverlayClick() {
  if (!props.closeOnOverlayClick) {
    return;
  }

  close();
}

function focusInput() {
  const input = contentRef.value?.querySelector<HTMLInputElement>(
    '.vf-command-palette__input input, input.vf-command-palette__input',
  );
  input?.focus();
  input?.select();
}

function moveActiveIndex(step: number) {
  if (itemsCount.value === 0) {
    activeIndex.value = -1;
    return;
  }

  if (activeIndex.value === -1) {
    activeIndex.value = step > 0 ? 0 : itemsCount.value - 1;
    return;
  }

  activeIndex.value = (activeIndex.value + step + itemsCount.value) % itemsCount.value;
}

function handleSelect(item: unknown) {
  emit('select', item);

  if (props.closeOnSelect) {
    close();
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    pointerNavigationEnabled.value = false;
    event.preventDefault();
    moveActiveIndex(1);
    return;
  }

  if (event.key === 'ArrowUp') {
    pointerNavigationEnabled.value = false;
    event.preventDefault();
    moveActiveIndex(-1);
    return;
  }

  if (event.key === 'Enter') {
    pointerNavigationEnabled.value = false;
    event.preventDefault();

    if (activeIndex.value >= 0 && props.items[activeIndex.value] !== undefined) {
      handleSelect(props.items[activeIndex.value]);
      return;
    }

    emit('submit', query.value);
  }
}

function handleItemPointerMove(index: number, event: MouseEvent) {
  const hasPointerMoved =
    lastPointerClientX.value == null ||
    lastPointerClientY.value == null ||
    event.clientX !== lastPointerClientX.value ||
    event.clientY !== lastPointerClientY.value;

  lastPointerClientX.value = event.clientX;
  lastPointerClientY.value = event.clientY;

  if (pointerResetPending.value && !hasPointerMoved) {
    return;
  }

  pointerResetPending.value = false;
  pointerNavigationEnabled.value = true;
  activeIndex.value = index;
}

function getItemLabel(item: unknown): string {
  if (typeof item === 'string') {
    return item;
  }

  if (item != null && typeof item === 'object') {
    const record = item as Record<string, unknown>;

    if (typeof record.label === 'string') {
      return record.label;
    }

    if (typeof record.title === 'string') {
      return record.title;
    }

    if (typeof record.value === 'string') {
      return record.value;
    }
  }

  return String(item ?? '');
}

function getItemField(item: unknown, keys: string[]): string {
  if (item == null || typeof item !== 'object') {
    return '';
  }

  const record = item as Record<string, unknown>;

  for (const key of keys) {
    if (typeof record[key] === 'string') {
      return record[key] as string;
    }
  }

  return '';
}

function getItemTitle(item: unknown): string {
  const title = getItemField(item, ['title', 'label', 'value', 'name']);
  if (title) {
    return title;
  }

  return getItemLabel(item);
}

function getItemBreadcrumb(item: unknown): string {
  return getItemField(item, ['breadcrumb', 'section', 'path', 'group', 'category']);
}

function getItemSnippet(item: unknown): string {
  return getItemField(item, ['snippet', 'description', 'text', 'content', 'summary']);
}

function getHighlightedParts(label: string) {
  const source = String(label ?? '');
  const needle = query.value.trim();

  if (!props.highlightMatches || !needle) {
    return [{ text: source, match: false }];
  }

  const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escapedNeedle, 'ig');
  const parts: Array<{ text: string; match: boolean }> = [];

  let lastIndex = 0;
  let result = pattern.exec(source);

  while (result != null) {
    const matchIndex = result.index;
    const matchText = result[0] ?? '';

    if (matchIndex > lastIndex) {
      parts.push({
        text: source.slice(lastIndex, matchIndex),
        match: false,
      });
    }

    if (matchText.length > 0) {
      parts.push({
        text: matchText,
        match: true,
      });
      lastIndex = matchIndex + matchText.length;
    } else {
      break;
    }

    result = pattern.exec(source);
  }

  if (lastIndex < source.length) {
    parts.push({
      text: source.slice(lastIndex),
      match: false,
    });
  }

  return parts.length > 0 ? parts : [{ text: source, match: false }];
}

useEscapeKey(
  (event) => {
    if (!props.closeOnEscape || !isOpen.value) {
      return;
    }

    event.preventDefault();
    close();
  },
  {
    enabled: isOpen,
  },
);

useFocusTrap(contentRef, {
  enabled: isOpen,
});

useScrollLock(isOpen);

watch(
  isOpen,
  async (value, previousValue) => {
    if (typeof document === 'undefined') {
      return;
    }

    if (value) {
      lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      activeIndex.value = -1;
      pointerResetPending.value = false;
      lastPointerClientX.value = null;
      lastPointerClientY.value = null;
      await nextTick();
      focusInput();

      if (!previousValue) {
        emit('open');
      }

      return;
    }

    lastFocusedElement.value?.focus();

    if (previousValue) {
      emit('close');
    }
  },
  { immediate: true },
);

watch(
  () => props.items,
  () => {
    if (activeIndex.value >= itemsCount.value) {
      activeIndex.value = itemsCount.value > 0 ? itemsCount.value - 1 : -1;
    }
  },
  { deep: true },
);

watch(query, () => {
  pointerNavigationEnabled.value = false;
  pointerResetPending.value = true;
  activeIndex.value = -1;
});

onBeforeUnmount(() => {
  if (isOpen.value) {
    lastFocusedElement.value?.focus();
  }
});
</script>

<template>
  <Teleport :to="teleportTarget" :disabled="teleportDisabled">
    <Transition name="vf-command-palette-transition" appear :duration="transitionDuration">
      <div v-if="isOpen" :class="rootClasses">
        <div class="vf-command-palette__overlay" aria-hidden="true" @click="handleOverlayClick" />

        <section
          ref="contentRef"
          :class="contentClasses"
          :style="[contentStyle, attrs.style as CSSProperties]"
          :aria-label="title"
          aria-modal="true"
          role="dialog"
          tabindex="-1"
          v-bind="rootAttrs"
        >
          <header class="vf-command-palette__header">
            <VfInput
              :model-value="query"
              :placeholder="placeholder"
              :leading-icon="icons.magnifyingGlass"
              clearable
              class="vf-command-palette__input"
              :spellcheck="false"
              autocomplete="off"
              @update:model-value="query = $event"
              @keydown="handleInputKeydown"
            />

            <div class="vf-command-palette__actions">
              <slot name="actions" :close="close" :query="query" />
            </div>
          </header>

          <div class="vf-command-palette__body">
            <slot
              v-if="$slots.default"
              :items="props.items"
              :query="query"
              :loading="loading"
              :active-index="activeIndex"
              :select="handleSelect"
              :close="close"
            />

            <template v-else>
              <p v-if="loading" class="vf-command-palette__status">Loading...</p>

              <ul
                v-else-if="itemsCount > 0"
                class="vf-command-palette__list"
                role="listbox"
                aria-label="Search results"
              >
                <li v-for="(item, index) in props.items" :key="index" class="vf-command-palette__list-item">
                  <button
                    class="vf-command-palette__item"
                    :class="index === activeIndex && 'vf-command-palette__item--active'"
                    type="button"
                    role="option"
                    :aria-selected="index === activeIndex"
                    @mousemove="handleItemPointerMove(index, $event)"
                    @click="handleSelect(item)"
                  >
                    <slot
                      name="item"
                      :item="item"
                      :index="index"
                      :active="index === activeIndex"
                      :query="query"
                      :select="() => handleSelect(item)"
                    >
                      <span class="vf-command-palette__item-layout">
                        <span class="vf-command-palette__item-content">
                          <span v-if="getItemBreadcrumb(item)" class="vf-command-palette__item-breadcrumb">
                            <span
                              v-for="(part, partIndex) in getHighlightedParts(getItemBreadcrumb(item))"
                              :key="`${index}-breadcrumb-${partIndex}`"
                              :class="part.match && 'vf-command-palette__item-match'"
                            >
                              {{ part.text }}
                            </span>
                          </span>

                          <span class="vf-command-palette__item-title">
                            <span class="vf-command-palette__item-leading-icon" aria-hidden="true">
                              <VueIconify :icon="icons.file" size="var(--vf-command-palette-item-icon-size)" />
                            </span>
                            <span
                              v-for="(part, partIndex) in getHighlightedParts(getItemTitle(item))"
                              :key="`${index}-title-${partIndex}`"
                              :class="part.match && 'vf-command-palette__item-match'"
                            >
                              {{ part.text }}
                            </span>
                          </span>

                          <span v-if="getItemSnippet(item)" class="vf-command-palette__item-snippet">
                            <span
                              v-for="(part, partIndex) in getHighlightedParts(getItemSnippet(item))"
                              :key="`${index}-snippet-${partIndex}`"
                              :class="part.match && 'vf-command-palette__item-match'"
                            >
                              {{ part.text }}
                            </span>
                          </span>
                        </span>

                        <span class="vf-command-palette__item-enter" aria-hidden="true">
                          <VueIconify :icon="icons.arrowTurnUpLeft" size="var(--vf-command-palette-item-icon-size)" />
                        </span>
                      </span>
                    </slot>
                  </button>
                </li>
              </ul>

              <div v-else-if="hasQuery" class="vf-command-palette__empty">
                <slot name="empty" :query="query">
                  {{ emptyText }}
                </slot>
              </div>

              <p v-else class="vf-command-palette__status">
                {{ idleText }}
              </p>
            </template>
          </div>

          <footer v-if="$slots.footer || props.showDefaultFooterHints" class="vf-command-palette__footer">
            <slot v-if="$slots.footer" name="footer" :close="close" :query="query" :items="props.items" />
            <div v-else class="vf-command-palette__hints" aria-label="Keyboard shortcuts">
              <span class="vf-command-palette__hint">
                <span class="vf-command-palette__hint-keys" aria-hidden="true">
                  <VfBadge class="vf-command-palette__hint-key vf-command-palette__hint-key--icon">
                    <VueIconify :icon="icons.arrowUp" size="var(--vf-command-palette-hint-icon-size)" />
                  </VfBadge>
                  <VfBadge class="vf-command-palette__hint-key vf-command-palette__hint-key--icon">
                    <VueIconify :icon="icons.arrowDown" size="var(--vf-command-palette-hint-icon-size)" />
                  </VfBadge>
                </span>
                <span class="vf-command-palette__hint-label">Navigate</span>
              </span>

              <span class="vf-command-palette__hint">
                <span class="vf-command-palette__hint-keys" aria-hidden="true">
                  <VfBadge class="vf-command-palette__hint-key vf-command-palette__hint-key--icon">
                    <VueIconify :icon="icons.arrowTurnUpLeft" size="var(--vf-command-palette-hint-icon-size)" />
                  </VfBadge>
                </span>
                <span class="vf-command-palette__hint-label">Select</span>
              </span>

              <span class="vf-command-palette__hint">
                <span class="vf-command-palette__hint-keys" aria-hidden="true">
                  <VfBadge class="vf-command-palette__hint-key">Esc</VfBadge>
                </span>
                <span class="vf-command-palette__hint-label">Close</span>
              </span>
            </div>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
