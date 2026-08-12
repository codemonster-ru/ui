<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import { useCmModal } from '../modal/use-modal';
import type { CmCommandPaletteItem } from './command-palette.types';

defineOptions({ inheritAttrs: false });
const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  commands: { type: Array as PropType<readonly CmCommandPaletteItem[]>, required: true },
  open: Boolean,
  query: { type: String, default: '' },
  placeholder: { type: String, default: 'Search commands' },
  emptyText: { type: String, default: 'No commands found.' },
  closeLabel: { type: String, default: 'Close' },
});
const emit = defineEmits<{
  openChange: [open: boolean];
  queryChange: [query: string];
  select: [value: string];
  'update:open': [open: boolean];
  'update:query': [query: string];
}>();
const attrs = useAttrs();
if (![props.id, props.title, props.placeholder, props.emptyText, props.closeLabel].every((value) => value.trim())) {
  throw new TypeError('CommandPalette text props must be non-empty strings.');
}
const normalizedCommands = computed(() => {
  if (props.commands.length === 0) throw new TypeError('CommandPalette requires commands.');
  const ids = new Set<string>();
  for (const command of props.commands) {
    if (!idPattern.test(command.id) || !command.label.trim() || ids.has(command.id)) {
      throw new TypeError(`Invalid CommandPalette command: ${command.id}.`);
    }
    ids.add(command.id);
  }
  return props.commands;
});
const localQuery = ref(props.query);
const visibleCommands = computed(() => {
  const needle = localQuery.value.trim().toLocaleLowerCase();
  return normalizedCommands.value.filter((command) =>
    needle === '' ? true : `${command.label} ${command.keywords ?? ''}`.toLocaleLowerCase().includes(needle),
  );
});
const enabledCommands = computed(() => visibleCommands.value.filter(({ disabled }) => !disabled));
const activeId = ref(enabledCommands.value[0]?.id ?? '');
watch(
  () => props.query,
  (query) => (localQuery.value = query),
);
watch(visibleCommands, () => {
  if (!enabledCommands.value.some(({ id }) => id === activeId.value))
    activeId.value = enabledCommands.value[0]?.id ?? '';
});
const modal = useCmModal(
  () => props.open,
  (open) => {
    emit('update:open', open);
    emit('openChange', open);
  },
);
const { dialog, localOpen, onCancel, onKeydown: onModalKeydown, setOpen } = modal;
const classes = computed(() =>
  mergeCmClasses(
    'cm-command-palette',
    localOpen.value ? 'cm-command-palette--open' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['id', 'open', 'aria-labelledby', 'data-cm-controller', 'data-cm-command-palette-state']),
);

function updateQuery(event: Event): void {
  localQuery.value = (event.target as HTMLInputElement).value;
  emit('update:query', localQuery.value);
  emit('queryChange', localQuery.value);
}

function select(command: CmCommandPaletteItem): void {
  if (command.disabled) return;
  emit('select', command.id);
  setOpen(false);
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    const command = enabledCommands.value.find(({ id }) => id === activeId.value);
    if (command) {
      event.preventDefault();
      select(command);
    }
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || enabledCommands.value.length === 0) return;
  event.preventDefault();
  const current = enabledCommands.value.findIndex(({ id }) => id === activeId.value);
  const last = enabledCommands.value.length - 1;
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : event.key === 'ArrowDown'
          ? (Math.max(current, -1) + 1) % enabledCommands.value.length
          : current <= 0
            ? last
            : current - 1;
  activeId.value = enabledCommands.value[next]!.id;
  document.getElementById(`${props.id}-option-${activeId.value}`)?.scrollIntoView?.({ block: 'nearest' });
}

function onKeydown(event: KeyboardEvent): void {
  onInputKeydown(event);
  onModalKeydown(event);
}
</script>

<template>
  <dialog
    :id="`${props.id}-command-palette`"
    ref="dialog"
    v-bind="rootAttrs"
    :class="classes"
    :open="localOpen || undefined"
    :aria-labelledby="`${props.id}-title`"
    data-cm-controller="command-palette"
    :data-cm-command-palette-state="localOpen ? 'open' : 'closed'"
    @cancel="onCancel"
    @keydown="onModalKeydown"
  >
    <div class="cm-command-palette__surface">
      <header class="cm-command-palette__header">
        <h2 :id="`${props.id}-title`" class="cm-command-palette__title">{{ props.title }}</h2>
        <!-- prettier-ignore -->
        <button class="cm-command-palette__close" type="button" :aria-label="props.closeLabel" data-cm-command-palette-close @click="setOpen(false)">×</button>
      </header>
      <input
        class="cm-command-palette__input"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="localOpen"
        :aria-controls="`${props.id}-listbox`"
        :aria-activedescendant="activeId ? `${props.id}-option-${activeId}` : undefined"
        :placeholder="props.placeholder"
        :value="localQuery"
        data-cm-command-palette-input
        autofocus
        @input="updateQuery"
        @keydown.stop="onKeydown"
      />
      <ul :id="`${props.id}-listbox`" class="cm-command-palette__list" role="listbox">
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
        >
          {{ command.label }}
        </li>
      </ul>
      <p class="cm-command-palette__empty" :hidden="visibleCommands.length > 0">{{ props.emptyText }}</p>
    </div>
  </dialog>
</template>
