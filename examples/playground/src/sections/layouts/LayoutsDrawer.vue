<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { CmIconButton } from '@codemonster-ru/ui-vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import './layouts-drawer.css';

const props = defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const contentRef = ref<HTMLElement | null>(null);
let returnFocus: HTMLElement | null = null;

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function close() {
  emit('update:open', false);
}

function focusableElements() {
  return [...(contentRef.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])].filter(
    (element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== 'Tab') return;

  const controls = focusableElements();
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first || !last) {
    event.preventDefault();
    contentRef.value?.focus();
  } else if (event.shiftKey && (document.activeElement === first || document.activeElement === contentRef.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      contentRef.value?.focus();
      return;
    }

    returnFocus?.focus();
    returnFocus = null;
  },
);

onBeforeUnmount(() => {
  if (props.open) returnFocus?.focus();
});
</script>

<template>
  <Transition name="layouts-drawer">
    <div v-if="open" class="layouts-drawer" @keydown="handleKeydown">
      <div class="layouts-drawer__overlay" aria-hidden="true" @click="close" />
      <section
        ref="contentRef"
        class="layouts-drawer__content"
        aria-modal="true"
        role="dialog"
        aria-labelledby="layouts-admin-drawer-title"
        tabindex="-1"
      >
        <header class="layouts-drawer__header">
          <h2 id="layouts-admin-drawer-title" class="layouts-drawer__title">{{ title }}</h2>
          <div class="layouts-drawer__actions">
            <CmIconButton label="Close drawer" size="md" variant="ghost" @click="close">
              <VueIconify :icon="icons.xmark" size="var(--cm-icon-size-md)" />
            </CmIconButton>
          </div>
        </header>
        <div class="layouts-drawer__body"><slot :close="close" /></div>
      </section>
    </div>
  </Transition>
</template>
