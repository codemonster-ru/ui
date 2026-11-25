<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  computed,
  getCurrentInstance,
  isVNode,
  useAttrs,
  useSlots,
  useTemplateRef,
} from 'vue';

import { shouldEnterAdvance } from '@codemonster-ru/ui-runtime/core';
import type { CmSetupLayoutProps } from './setup-layout.types';
import { useLayoutOwnership } from '../use-layout-ownership';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CmSetupLayoutProps>(), {
  as: 'main',
  title: null,
  description: null,
  asidePosition: 'left',
  fillViewport: true,
  surface: true,
  keyboardNavigation: true,
});
const emit = defineEmits<{ next: [event: KeyboardEvent]; back: [event: KeyboardEvent] }>();
const attrs = useAttrs();
const slots = useSlots();
const instance = getCurrentInstance();
useLayoutOwnership(useTemplateRef<HTMLElement>('root'));

const asidePosition = computed(() => (props.asidePosition === 'left' ? 'left' : 'right'));
const classes = computed(() => [
  'cm-setup-layout',
  asidePosition.value === 'right' ? undefined : `cm-setup-layout--aside-${asidePosition.value}`,
  !props.fillViewport && 'cm-setup-layout--fit-content',
  !props.surface && 'cm-setup-layout--plain',
  attrs.class,
]);

function hasContent(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasContent);
  if (typeof node === 'string') return node.trim().length > 0;
  if (typeof node === 'number') return true;
  if (!isVNode(node) || node.type === Comment) return false;
  if (node.type === Text || node.type === Fragment) return hasContent(node.children);
  return true;
}

function hasSlotContent(name: string): boolean {
  return hasContent(slots[name]?.());
}

function emitNavigation(name: 'next' | 'back', event: KeyboardEvent): void {
  const listener = name === 'next' ? 'onNext' : 'onBack';
  if (instance?.vnode.props?.[listener] || instance?.vnode.props?.[`${listener}Once`]) event.preventDefault();
  if (name === 'next') emit('next', event);
  else emit('back', event);
}

// The layout describes what has focus and asks the core whether Enter means "advance" here. A
// wizard that steals Enter from a textarea is worse than one that never offered the shortcut.
function onKeydown(event: KeyboardEvent): void {
  if (
    !props.keyboardNavigation ||
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;

  if (event.key === 'Escape') {
    emitNavigation('back', event);
    return;
  }

  if (event.key !== 'Enter' || event.shiftKey) return;

  const target = event.target;
  const element = target instanceof HTMLElement ? target : null;
  const advance = shouldEnterAdvance({
    editable: Boolean(element?.isContentEditable || element?.closest('[contenteditable="true"]')),
    inputType: element instanceof HTMLInputElement ? element.type : undefined,
    interactive: Boolean(element?.closest('button,a,[role="button"],[role="link"]')),
    tagName: element?.tagName,
  });
  if (!advance) return;

  emitNavigation('next', event);
}
</script>

<template>
  <component
    :is="props.as"
    ref="root"
    v-bind="attrs"
    :class="classes"
    data-cm-controller="setup-layout"
    @keydown="onKeydown"
  >
    <div class="cm-setup-layout__panel">
      <div v-if="hasSlotContent('brand')" class="cm-setup-layout__brand"><slot name="brand" /></div>
      <div v-if="hasSlotContent('toolbar')" class="cm-setup-layout__toolbar"><slot name="toolbar" /></div>
      <aside v-if="hasSlotContent('aside')" class="cm-setup-layout__aside"><slot name="aside" /></aside>
      <header
        v-if="props.title || props.description || hasSlotContent('title') || hasSlotContent('description')"
        class="cm-setup-layout__header"
      >
        <div class="cm-setup-layout__heading">
          <h1 v-if="props.title || hasSlotContent('title')" class="cm-setup-layout__title">
            <slot name="title">{{ props.title }}</slot>
          </h1>
          <p v-if="props.description || hasSlotContent('description')" class="cm-setup-layout__description">
            <slot name="description">{{ props.description }}</slot>
          </p>
        </div>
      </header>
      <section class="cm-setup-layout__main">
        <div class="cm-setup-layout__body"><slot /></div>
        <div v-if="hasSlotContent('actions')" class="cm-setup-layout__actions"><slot name="actions" /></div>
      </section>
    </div>
    <footer v-if="hasSlotContent('footer')" class="cm-setup-layout__footer"><slot name="footer" /></footer>
  </component>
</template>
