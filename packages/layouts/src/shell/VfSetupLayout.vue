<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  computed,
  getCurrentInstance,
  type StyleValue,
  type VNode,
  useAttrs,
  useSlots,
} from 'vue';
import VfContainer from '../primitives/VfContainer.vue';
import { cx } from '../utils/classes';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    title?: string | null;
    description?: string | null;
    fillViewport?: boolean;
    surface?: boolean;
    asidePosition?: 'left' | 'right';
    keyboardNavigation?: boolean;
  }>(),
  {
    as: 'main',
    title: null,
    description: null,
    fillViewport: true,
    surface: true,
    asidePosition: 'left',
    keyboardNavigation: true,
  },
);

const emit = defineEmits<{
  next: [event: KeyboardEvent];
  back: [event: KeyboardEvent];
}>();

const attrs = useAttrs();
const slots = useSlots();
const instance = getCurrentInstance();

function hasSlotContent(name: 'brand' | 'toolbar' | 'title' | 'description' | 'aside' | 'actions' | 'footer') {
  const slot = slots[name];

  if (!slot) return false;

  const nodes = slot();

  function hasMeaningfulNode(node: VNode): boolean {
    if (node.type === Comment) return false;
    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0;
    }
    if (node.type === Fragment) {
      const children = Array.isArray(node.children) ? node.children : [];
      return children.some((child) => hasMeaningfulNode(child as VNode));
    }

    return true;
  }

  return nodes.some((node) => hasMeaningfulNode(node));
}

function hasBrand() {
  return hasSlotContent('brand');
}

function hasToolbar() {
  return hasSlotContent('toolbar');
}

function hasTitle() {
  return hasSlotContent('title') || Boolean(props.title);
}

function hasDescription() {
  return hasSlotContent('description') || Boolean(props.description);
}

function hasHeader() {
  return hasTitle() || hasDescription();
}

function hasAside() {
  return hasSlotContent('aside');
}

function hasActions() {
  return hasSlotContent('actions');
}

function hasFooter() {
  return hasSlotContent('footer');
}

function classes() {
  return cx(
    'vf-setup-layout',
    `vf-setup-layout--aside-${props.asidePosition}`,
    props.fillViewport && 'vf-setup-layout--fill-viewport',
    hasBrand() && 'vf-setup-layout--with-brand',
    hasToolbar() && 'vf-setup-layout--with-toolbar',
    hasAside() && 'vf-setup-layout--with-aside',
  );
}

const panelClasses = computed(() => cx('vf-setup-layout__panel', props.surface && 'vf-setup-layout__panel--surface'));
const containerStyle = computed<StyleValue>(() => ({
  '--vf-layout-container-max-width': 'var(--vf-layout-setup-layout-container-width)',
}));

function hasEmitListener(name: 'next' | 'back') {
  const listenerName = name === 'next' ? 'onNext' : 'onBack';

  return Boolean(instance?.vnode.props?.[listenerName]);
}

function isTextInput(target: HTMLInputElement) {
  const ignoredTypes = new Set(['button', 'checkbox', 'color', 'file', 'radio', 'range', 'reset', 'submit']);

  return !ignoredTypes.has(target.type);
}

function shouldIgnoreEnterTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return !isTextInput(target);
  }

  return Boolean(target.closest('button,a,[role="button"],[role="link"]'));
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.keyboardNavigation || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.key === 'Escape') {
    if (hasEmitListener('back')) {
      event.preventDefault();
    }

    emit('back', event);
    return;
  }

  if (event.key !== 'Enter' || event.shiftKey || shouldIgnoreEnterTarget(event.target)) {
    return;
  }

  if (hasEmitListener('next')) {
    event.preventDefault();
  }

  emit('next', event);
}
</script>

<template>
  <component :is="props.as" :class="classes()" v-bind="attrs" @keydown="handleKeydown">
    <VfContainer :style="containerStyle">
      <div :class="panelClasses">
        <div v-if="hasBrand()" class="vf-setup-layout__brand">
          <slot name="brand" />
        </div>

        <div v-if="hasToolbar()" class="vf-setup-layout__toolbar">
          <slot name="toolbar" />
        </div>

        <aside v-if="hasAside()" class="vf-setup-layout__aside">
          <slot name="aside" />
        </aside>

        <header v-if="hasHeader()" class="vf-setup-layout__header">
          <div v-if="hasTitle() || hasDescription()" class="vf-setup-layout__heading">
            <h1 v-if="hasTitle()" class="vf-setup-layout__title">
              <slot name="title">{{ props.title }}</slot>
            </h1>
            <p v-if="hasDescription()" class="vf-setup-layout__description">
              <slot name="description">{{ props.description }}</slot>
            </p>
          </div>
        </header>

        <section class="vf-setup-layout__main">
          <div class="vf-setup-layout__body">
            <slot />
          </div>

          <div v-if="hasActions()" class="vf-setup-layout__actions">
            <slot name="actions" />
          </div>
        </section>
      </div>

      <footer v-if="hasFooter()" class="vf-setup-layout__footer">
        <slot name="footer" />
      </footer>
    </VfContainer>
  </component>
</template>
