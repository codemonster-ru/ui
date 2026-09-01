<script setup lang="ts">
import { computed, useAttrs, useSlots, type PropType } from 'vue';

import { shouldEnterAdvance } from '@codemonster-ru/ui-runtime/core';
import type { CmSetupLayoutAsidePosition } from './setup-layout.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  title: { type: String as PropType<string | null>, default: null },
  description: { type: String as PropType<string | null>, default: null },
  asidePosition: {
    type: String as PropType<CmSetupLayoutAsidePosition>,
    default: 'right',
    validator: (value: string) => ['left', 'right'].includes(value),
  },
  keyboardNavigation: { type: Boolean, default: true },
});
const emit = defineEmits<{ next: []; back: [] }>();
const attrs = useAttrs();
const slots = useSlots();

const asidePosition = computed(() => (props.asidePosition === 'left' ? 'left' : 'right'));
const classes = computed(() => [
  'cm-setup-layout',
  asidePosition.value === 'right' ? undefined : `cm-setup-layout--aside-${asidePosition.value}`,
  attrs.class,
]);
const hasTitle = computed(() => Boolean(slots.title || props.title));
const hasDescription = computed(() => Boolean(slots.description || props.description));
const hasHeader = computed(() => hasTitle.value || hasDescription.value);

// The layout describes what has focus and asks the core whether Enter means "advance" here. A
// wizard that steals Enter from a textarea is worse than one that never offered the shortcut.
function onKeydown(event: KeyboardEvent): void {
  if (!props.keyboardNavigation || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    emit('back');
    return;
  }

  if (event.key !== 'Enter' || event.shiftKey) return;

  const target = event.target;
  const element = target instanceof HTMLElement ? target : null;
  const advance = shouldEnterAdvance({
    editable: element?.isContentEditable === true,
    inputType: element instanceof HTMLInputElement ? element.type : undefined,
    interactive: Boolean(element?.closest('button,a,[role="button"],[role="link"]')),
    tagName: element?.tagName,
  });
  if (!advance) return;

  event.preventDefault();
  emit('next');
}
</script>

<template>
  <main v-bind="attrs" :class="classes" data-cm-controller="setup-layout" @keydown="onKeydown">
    <div class="cm-setup-layout__panel">
      <div v-if="$slots.brand" class="cm-setup-layout__brand"><slot name="brand" /></div>
      <div v-if="$slots.toolbar" class="cm-setup-layout__toolbar"><slot name="toolbar" /></div>
      <aside v-if="$slots.aside" class="cm-setup-layout__aside"><slot name="aside" /></aside>
      <header v-if="hasHeader" class="cm-setup-layout__header">
        <div class="cm-setup-layout__heading">
          <h1 v-if="hasTitle" class="cm-setup-layout__title">
            <slot name="title">{{ props.title }}</slot>
          </h1>
          <p v-if="hasDescription" class="cm-setup-layout__description">
            <slot name="description">{{ props.description }}</slot>
          </p>
        </div>
      </header>
      <section class="cm-setup-layout__main">
        <div class="cm-setup-layout__body"><slot /></div>
        <div v-if="$slots.actions" class="cm-setup-layout__actions"><slot name="actions" /></div>
      </section>
    </div>
    <footer v-if="$slots.footer" class="cm-setup-layout__footer"><slot name="footer" /></footer>
  </main>
</template>
