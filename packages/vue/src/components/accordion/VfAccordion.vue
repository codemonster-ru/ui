<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDisclosure } from '../../composables/disclosure';
import { useId } from '../../composables/id';
import type { VfAccordionProps } from './accordion.types';

const props = withDefaults(defineProps<VfAccordionProps>(), { open: undefined, title: undefined });
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const slots = defineSlots<{
  trigger?(scope: { open: boolean }): unknown;
  default?(scope: { open: boolean }): unknown;
}>();
const triggerId = useId({ prefix: 'vf-accordion-trigger' });
const panelId = useId({ prefix: 'vf-accordion-content' });
const trigger = ref<HTMLButtonElement>();
const region = ref<HTMLElement>();
const { isOpen, toggle } = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: () => props.open,
  onOpenChange(open) {
    emit('update:open', open);
    emit('openChange', open);
  },
});

watch(isOpen, (open) => {
  if (!open && region.value?.contains(region.value.ownerDocument.activeElement)) trigger.value?.focus();
});
</script>

<template>
  <section class="cm-accordion">
    <div class="cm-accordion__item">
      <button
        :id="triggerId"
        ref="trigger"
        type="button"
        class="cm-accordion__trigger"
        :aria-controls="panelId"
        :aria-expanded="isOpen"
        :aria-label="!props.title && !slots.trigger ? 'Toggle section' : undefined"
        :disabled="props.disabled"
        @click="!props.disabled && toggle()"
      >
        <slot name="trigger" :open="isOpen"
          ><span>{{ props.title }}</span></slot
        >
      </button>
      <div
        :id="panelId"
        ref="region"
        role="region"
        :aria-labelledby="triggerId"
        :aria-hidden="!isOpen || undefined"
        :inert="!isOpen"
      >
        <Transition name="cm-accordion-panel">
          <div v-if="isOpen" class="cm-accordion__collapse">
            <div class="cm-accordion__clip">
              <div class="cm-accordion__panel"><slot :open="isOpen" /></div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>
