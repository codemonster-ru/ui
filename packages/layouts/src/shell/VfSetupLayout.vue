<script setup lang="ts">
import { Comment, Fragment, Text, computed, type StyleValue, type VNode, useAttrs, useSlots } from 'vue';
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
  }>(),
  {
    as: 'main',
    title: null,
    description: null,
    fillViewport: true,
    surface: true,
    asidePosition: 'left',
  },
);

const attrs = useAttrs();
const slots = useSlots();

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
</script>

<template>
  <component :is="props.as" :class="classes()" v-bind="attrs">
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
