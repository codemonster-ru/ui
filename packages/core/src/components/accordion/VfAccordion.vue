<script setup lang="ts">
import { computed } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { useDisclosure, useId } from '@/composables';
import { vfMotionDurationsMs } from '@/theme/motion';

interface VfAccordionProps {
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<VfAccordionProps>(), {
  open: undefined,
  defaultOpen: false,
  title: undefined,
  disabled: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
}>();

const triggerId = useId({ prefix: 'vf-accordion-trigger' });
const contentId = useId({ prefix: 'vf-accordion-content' });

const disclosure = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: computed(() => props.open),
  onOpenChange: (value) => {
    emit('update:open', value);
    emit('openChange', value);
  },
});
const isOpen = disclosure.isOpen;

const accordionTransition = [
  'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
  'opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
].join(', ');

function getContentHeight(target: HTMLElement) {
  const inner = target.firstElementChild as HTMLElement | null;
  return inner?.offsetHeight ?? target.scrollHeight;
}

function toggle() {
  if (!props.disabled) {
    disclosure.toggle();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  }
}

function onBeforeEnter(el: Element) {
  const target = el as HTMLElement;
  target.style.height = '0px';
  target.style.opacity = '0';
  target.style.overflow = 'hidden';
}

function onEnter(el: Element, done: () => void) {
  const target = el as HTMLElement;
  target.style.transition = accordionTransition;

  requestAnimationFrame(() => {
    target.style.height = `${getContentHeight(target)}px`;
    target.style.opacity = '1';
  });

  window.setTimeout(done, vfMotionDurationsMs.normal);
}

function onAfterEnter(el: Element) {
  const target = el as HTMLElement;
  target.style.height = '';
  target.style.opacity = '';
  target.style.overflow = '';
  target.style.transition = '';
}

function onBeforeLeave(el: Element) {
  const target = el as HTMLElement;
  target.style.height = `${getContentHeight(target)}px`;
  target.style.opacity = '1';
  target.style.overflow = 'hidden';
}

function onLeave(el: Element, done: () => void) {
  const target = el as HTMLElement;
  target.style.transition = accordionTransition;
  void target.offsetHeight;
  target.style.height = '0px';
  target.style.opacity = '0';

  window.setTimeout(done, vfMotionDurationsMs.normal);
}

function onAfterLeave(el: Element) {
  const target = el as HTMLElement;
  target.style.height = '';
  target.style.opacity = '';
  target.style.overflow = '';
  target.style.transition = '';
}
</script>

<template>
  <section class="vf-accordion">
    <button
      :id="triggerId"
      :aria-controls="contentId"
      :aria-expanded="isOpen"
      :disabled="disabled"
      class="vf-accordion__trigger"
      type="button"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <slot name="trigger" :open="isOpen">
        <span>{{ title }}</span>
      </slot>

      <span aria-hidden="true" :class="['vf-accordion__icon', isOpen && 'vf-accordion__icon--open']">
        <VueIconify :icon="icons.chevronDown" size="var(--vf-icon-size-sm)" />
      </span>
    </button>

    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="isOpen" :id="contentId" :aria-labelledby="triggerId" class="vf-accordion__content" role="region">
        <div class="vf-accordion__content-inner">
          <slot :open="isOpen" />
        </div>
      </div>
    </Transition>
  </section>
</template>
