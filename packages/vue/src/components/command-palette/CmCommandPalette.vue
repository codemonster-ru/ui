<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { commandPaletteKeyAction, filterCommands } from '@codemonster-ru/ui-runtime/core';
import { warnCm } from '../../internal/warn';
import { useCmModal } from '../modal/use-modal';
import type { CmCommandPaletteItem } from './command-palette.types';

defineOptions({ inheritAttrs: false });
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  commands: { type: Array as PropType<readonly CmCommandPaletteItem[]>, required: true },
  open: { type: Boolean, default: undefined },
  defaultOpen: Boolean,
  query: { type: String, default: undefined },
  defaultQuery: { type: String, default: '' },
  loading: Boolean,
  placeholder: { type: String, default: 'Search commands' },
  loadingText: { type: String, default: 'Loading commands…' },
  idleText: { type: String, default: 'Start typing to search.' },
  emptyText: { type: String, default: 'No commands found.' },
  closeLabel: { type: String, default: 'Close' },
  filter: { type: Boolean, default: true },
  autoActivate: { type: Boolean, default: true },
  closeOnSelect: { type: Boolean, default: true },
  closeOnOverlayClick: Boolean,
  closeOnEscape: { type: Boolean, default: true },
  dividers: { type: Boolean, default: true },
  maxHeight: { type: [String, Number], default: undefined },
});
const emit = defineEmits<{
  openChange: [open: boolean];
  queryChange: [query: string];
  select: [value: string];
  submit: [query: string];
  close: [];
  open: [];
  'update:open': [open: boolean];
  'update:query': [query: string];
}>();
const attrs = useAttrs();
if (
  ![
    props.id,
    props.title,
    props.placeholder,
    props.loadingText,
    props.idleText,
    props.emptyText,
    props.closeLabel,
  ].every((value) => value.trim())
) {
  warnCm('CommandPalette text props must be non-empty strings.');
}
const normalizedCommands = computed(() => {
  const ids = new Set<string>();
  const commands: CmCommandPaletteItem[] = [];
  for (const command of props.commands) {
    if (!idPattern.test(command.id) || !command.label.trim() || ids.has(command.id)) {
      warnCm(`Invalid CommandPalette command: ${command.id}. The command is not rendered.`);
      continue;
    }
    ids.add(command.id);
    commands.push(command);
  }
  return commands;
});
const input = ref<HTMLInputElement>();
const localQuery = ref(props.defaultQuery);
const currentQuery = computed(() => props.query ?? localQuery.value);
const visibleCommands = computed(() =>
  props.loading
    ? []
    : props.filter
      ? filterCommands(normalizedCommands.value, currentQuery.value)
      : normalizedCommands.value,
);
const enabledCommands = computed(() => visibleCommands.value.filter(({ disabled }) => !disabled));
const hasQuery = computed(() => currentQuery.value.trim() !== '');
const isIdle = computed(() => !props.loading && !hasQuery.value && normalizedCommands.value.length === 0);
const isEmpty = computed(() => !props.loading && hasQuery.value && visibleCommands.value.length === 0);
const activeId = ref(props.autoActivate ? (enabledCommands.value[0]?.id ?? '') : '');
const activeIndex = computed(() => enabledCommands.value.findIndex(({ id }) => id === activeId.value));
watch(currentQuery, () => {
  if (!props.autoActivate) activeId.value = '';
});
watch(visibleCommands, () => {
  if (!enabledCommands.value.some(({ id }) => id === activeId.value))
    activeId.value = props.autoActivate ? (enabledCommands.value[0]?.id ?? '') : '';
});
const startOpen = props.defaultOpen;
const modal = useCmModal(
  () => props.open ?? startOpen,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
);
const { dialog, localOpen, onCancel, onClose, onKeydown: onModalKeydown, setOpen } = modal;
defineExpose({ restoreAfterMove: modal.restoreAfterMove });
const close = () => setOpen(false);
watch(localOpen, (open) => {
  if (open) {
    if (!props.autoActivate) activeId.value = '';
    emit('open');
  } else emit('close');
});
onMounted(() => {
  if (localOpen.value) emit('open');
});
const classes = computed(() =>
  mergeCmClasses('cm-command-palette', localOpen.value ? 'cm-command-palette--open' : undefined, attrs.class),
);
const rootAttrs = () => {
  const forwarded = omitCmOwnedAttrs(attrs, [
    'id',
    'open',
    'aria-labelledby',
    'data-cm-controller',
    'data-cm-command-palette-state',
    'data-cm-command-palette-loading',
    'data-cm-command-palette-dividers',
    'data-cm-command-palette-filter',
    'data-cm-command-palette-auto-activate',
    'data-cm-command-palette-close-on-select',
    'data-cm-command-palette-close-on-overlay-click',
    'data-cm-command-palette-close-on-escape',
  ]);
  if (props.maxHeight !== undefined) {
    const maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
    forwarded.style = [attrs.style, { '--cm-command-palette-max-height': maxHeight }];
  }
  return forwarded;
};

function updateQuery(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  if (props.query === undefined) localQuery.value = value;
  emit('update:query', value);
  emit('queryChange', value);
  void nextTick(() => {
    if (input.value && input.value.value !== currentQuery.value) input.value.value = currentQuery.value;
  });
}

function select(command: CmCommandPaletteItem): void {
  if (command.disabled) return;
  emit('select', command.id);
  if (props.closeOnSelect) close();
}

function commandSlotName(id: string): string {
  return `command${id
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
}

function onInputKeydown(event: KeyboardEvent): void {
  const action = commandPaletteKeyAction(event.key, {
    activeIndex: activeIndex.value,
    count: enabledCommands.value.length,
  });
  if (!action) {
    if (event.key === 'Enter') {
      event.preventDefault();
      emit('submit', currentQuery.value);
    }
    return;
  }

  event.preventDefault();
  if (action.type === 'commit') {
    const command = enabledCommands.value[activeIndex.value];
    if (command) select(command);
    return;
  }

  const next = enabledCommands.value[action.index];
  if (!next) return;
  activeId.value = next.id;
  document.getElementById(`${props.id}-option-${activeId.value}`)?.scrollIntoView?.({ block: 'nearest' });
}

function onKeydown(event: KeyboardEvent): void {
  if (event.target === input.value && !event.isComposing) onInputKeydown(event);
  onModalKeydown(event, props.closeOnEscape);
}

function onBackdropClick(event: MouseEvent): void {
  const element = dialog.value;
  if (!props.closeOnOverlayClick || !element || event.target !== element) return;
  const { left, top, right, bottom } = element.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) close();
}

useCmHydrated();
</script>

<template>
  <dialog
    :id="`${props.id}-command-palette`"
    ref="dialog"
    v-bind="rootAttrs()"
    :class="classes"
    :open="localOpen || undefined"
    :aria-labelledby="`${props.id}-title`"
    data-cm-controller="command-palette"
    :data-cm-command-palette-state="localOpen ? 'open' : 'closed'"
    :data-cm-command-palette-loading="props.loading ? 'true' : undefined"
    :data-cm-command-palette-dividers="props.dividers ? undefined : 'false'"
    :data-cm-command-palette-filter="props.filter ? undefined : 'false'"
    :data-cm-command-palette-auto-activate="props.autoActivate ? undefined : 'false'"
    :data-cm-command-palette-close-on-select="props.closeOnSelect ? undefined : 'false'"
    :data-cm-command-palette-close-on-overlay-click="props.closeOnOverlayClick ? 'true' : undefined"
    :data-cm-command-palette-close-on-escape="props.closeOnEscape ? undefined : 'false'"
    @cancel="props.closeOnEscape ? onCancel($event) : $event.preventDefault()"
    @close="onClose"
    @keydown.stop="onKeydown"
    @click="onBackdropClick"
  >
    <div class="cm-command-palette__surface">
      <header class="cm-command-palette__header">
        <h2 :id="`${props.id}-title`" class="cm-command-palette__title">{{ props.title }}</h2>
        <div v-if="$slots.actions" class="cm-command-palette__actions">
          <slot name="actions" :close="close" :query="currentQuery" />
        </div>
        <!-- prettier-ignore -->
        <button class="cm-command-palette__close" type="button" :aria-label="props.closeLabel" data-cm-command-palette-close @click="setOpen(false)">×</button>
      </header>
      <input
        ref="input"
        class="cm-command-palette__input"
        type="search"
        :role="$slots.results ? undefined : 'combobox'"
        :aria-label="$slots.results ? props.title : undefined"
        :aria-autocomplete="$slots.results ? undefined : 'list'"
        :aria-expanded="$slots.results ? undefined : localOpen"
        :aria-controls="$slots.results ? undefined : `${props.id}-listbox`"
        :aria-activedescendant="activeId && !$slots.results ? `${props.id}-option-${activeId}` : undefined"
        :aria-busy="props.loading ? 'true' : undefined"
        :placeholder="props.placeholder"
        :value="currentQuery"
        data-cm-command-palette-input
        autofocus
        @input="updateQuery"
      />
      <div v-if="$slots.results" class="cm-command-palette__results">
        <slot
          name="results"
          :query="currentQuery"
          :commands="visibleCommands"
          :loading="props.loading"
          :active-index="activeIndex"
          :select="select"
          :close="close"
        />
      </div>
      <template v-else>
        <p v-if="props.loading" class="cm-command-palette__status" role="status">
          <slot name="loading">{{ props.loadingText }}</slot>
        </p>
        <ul :id="`${props.id}-listbox`" class="cm-command-palette__list" role="listbox" :hidden="props.loading">
          <li
            v-for="command in normalizedCommands"
            :id="`${props.id}-option-${command.id}`"
            :key="command.id"
            class="cm-command-palette__option"
            :class="activeId === command.id ? 'cm-command-palette__option--active' : undefined"
            role="option"
            :aria-selected="activeId === command.id"
            :aria-disabled="command.disabled ? 'true' : undefined"
            data-cm-command-palette-option
            :data-cm-command-value="command.id"
            :data-cm-command-keywords="command.keywords"
            :hidden="!visibleCommands.includes(command)"
            @click="select(command)"
            @pointermove="!props.autoActivate && !command.disabled && (activeId = command.id)"
          >
            <slot :name="commandSlotName(command.id)" :command="command" :active="activeId === command.id">
              <slot
                name="item"
                :command="command"
                :active="activeId === command.id"
                :query="currentQuery"
                :select="() => select(command)"
                >{{ command.label }}</slot
              >
            </slot>
          </li>
        </ul>
        <p v-if="normalizedCommands.length === 0" class="cm-command-palette__idle" :hidden="!isIdle">
          <slot name="idle">{{ props.idleText }}</slot>
        </p>
        <p class="cm-command-palette__empty" :hidden="!isEmpty">
          <slot name="empty" :query="currentQuery">{{ props.emptyText }}</slot>
        </p>
      </template>
      <footer v-if="$slots.footer" class="cm-command-palette__footer">
        <slot name="footer" :query="currentQuery" :close="close" :commands="normalizedCommands" />
      </footer>
    </div>
  </dialog>
</template>
