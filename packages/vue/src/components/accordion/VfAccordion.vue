<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import type { VfAccordionProps } from './accordion.types';

const props = withDefaults(defineProps<VfAccordionProps>(), { open: undefined, title: undefined });
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const slots = defineSlots<{
  trigger?(scope: { open: boolean }): unknown;
  default?(scope: { open: boolean }): unknown;
}>();
const id = useId();
const trigger = ref<HTMLButtonElement>();
const region = ref<HTMLElement>();
const localOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? localOpen.value);

function toggle(): void {
  if (props.disabled) return;
  const next = !isOpen.value;
  if (props.open === undefined) localOpen.value = next;
  emit('update:open', next);
  emit('openChange', next);
}

watch(isOpen, (open) => {
  if (!open && region.value?.contains(region.value.ownerDocument.activeElement)) trigger.value?.focus();
});
</script>

<template>
  <section class="cm-accordion">
    <div class="cm-accordion__item">
      <button
        :id="`${id}-trigger`"
        ref="trigger"
        type="button"
        class="cm-accordion__trigger"
        :aria-controls="`${id}-panel`"
        :aria-expanded="isOpen"
        :aria-label="!props.title && !slots.trigger ? 'Toggle section' : undefined"
        :disabled="props.disabled"
        @click="toggle"
      >
        <slot name="trigger" :open="isOpen"
          ><span>{{ props.title }}</span></slot
        >
      </button>
      <div
        :id="`${id}-panel`"
        ref="region"
        role="region"
        :aria-labelledby="`${id}-trigger`"
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
