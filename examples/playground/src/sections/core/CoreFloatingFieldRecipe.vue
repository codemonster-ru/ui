<script lang="ts">
export type CoreFloatingFieldVariant = 'in' | 'on' | 'over';

export interface CoreFloatingFieldSlotContext {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  floating: true;
  floatingVariant: CoreFloatingFieldVariant;
  setFilled: (filled: boolean) => void;
  setOpen: (open: boolean) => void;
}
</script>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  useAttrs,
  useId,
  type PropType,
} from 'vue';

import { coreSelectRecipeFieldContextKey, type CoreSelectRecipeFieldContext } from './CoreSelectRecipe.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  controlId: { type: String, default: undefined },
  label: { type: String, default: undefined },
  description: { type: String, default: undefined },
  error: { type: String, default: undefined },
  invalid: Boolean,
  required: Boolean,
  variant: {
    type: String as PropType<CoreFloatingFieldVariant>,
    default: 'in',
    validator: (value: string) => ['in', 'on', 'over'].includes(value),
  },
});

const slots = defineSlots<{
  default?: (scope: CoreFloatingFieldSlotContext) => unknown;
  label?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
const attrs = useAttrs();
const generatedId = useId();
const rootRef = ref<HTMLElement | null>(null);
const focused = ref(false);
const filled = ref(false);
const open = ref(false);
const floatingSupported = ref(true);
let filledObserver: MutationObserver | undefined;

const resolvedControlId = computed(() => props.controlId ?? `core-floating-field-${generatedId}`);
const descriptionId = computed(() => `${resolvedControlId.value}-description`);
const errorId = computed(() => `${resolvedControlId.value}-error`);
const hasLabel = computed(() => Boolean(props.label || slots.label));
const hasDescription = computed(() => Boolean(props.description || slots.description));
const hasError = computed(() => Boolean(props.error || slots.error));
const isInvalid = computed(() => props.invalid || hasError.value);
const active = computed(() => focused.value || filled.value || open.value);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));
  return ids.length ? ids.join(' ') : undefined;
});
const slotContext = computed<CoreFloatingFieldSlotContext>(() => ({
  controlId: resolvedControlId.value,
  describedBy: describedBy.value,
  invalid: isInvalid.value,
  required: props.required,
  floating: true,
  floatingVariant: props.variant,
  setFilled,
  setOpen,
}));

const selectContext: CoreSelectRecipeFieldContext = {
  labelPlacement: ref('floating'),
  floatingVariant: toRef(props, 'variant'),
  setFilled,
  setFloatingSupported(supported) {
    floatingSupported.value = supported;
  },
};
provide(coreSelectRecipeFieldContextKey, selectContext);

function setFilled(value: boolean): void {
  filled.value = value;
}

function setOpen(value: boolean): void {
  open.value = value;
}

function handleValueEvent(event: Event): void {
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    setFilled(target.value.length > 0);
  }
}

function syncFilledFromControl(): void {
  const root = rootRef.value;
  if (!root) return;
  const markedControl = root.querySelector('[data-cm-filled]');
  const nativeControl = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select',
  );
  if (markedControl || nativeControl) setFilled(Boolean(markedControl || nativeControl?.value.length));
}

function handleFocusIn(): void {
  focused.value = true;
}

async function handleFocusOut(): Promise<void> {
  await nextTick();
  focused.value = Boolean(rootRef.value?.contains(document.activeElement));
}

onMounted(() => {
  syncFilledFromControl();
  filledObserver = new MutationObserver(syncFilledFromControl);
  filledObserver.observe(rootRef.value!, { attributeFilter: ['data-cm-filled'], attributes: true, subtree: true });
});

onBeforeUnmount(() => filledObserver?.disconnect());
</script>

<template>
  <div
    ref="rootRef"
    v-bind="attrs"
    class="demo-application-floating-field"
    :class="[
      `demo-application-floating-field--${props.variant}`,
      active && 'demo-application-floating-field--active',
      isInvalid && 'demo-application-floating-field--invalid',
      !floatingSupported && 'demo-application-floating-field--unsupported',
      attrs.class,
    ]"
    :data-filled="filled || undefined"
    :data-focused="focused || undefined"
    :data-open="open || undefined"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @input="handleValueEvent"
    @change="handleValueEvent"
  >
    <div class="demo-application-floating-field__control">
      <slot v-bind="slotContext" />

      <label v-if="hasLabel" class="demo-application-floating-field__label" :for="resolvedControlId">
        <slot name="label">{{ props.label }}</slot
        ><span v-if="props.required" class="demo-application-floating-field__required" aria-hidden="true">*</span>
      </label>
    </div>

    <p v-if="hasDescription" :id="descriptionId" class="demo-application-floating-field__description">
      <slot name="description">{{ props.description }}</slot>
    </p>
    <p v-if="hasError" :id="errorId" class="demo-application-floating-field__error">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </div>
</template>

<style scoped>
.demo-application-floating-field {
  --demo-floating-input-padding-top: calc(var(--cm-space-4) + var(--cm-space-1) + var(--cm-border-width));
  --demo-floating-input-padding-bottom: calc(var(--cm-space-1) - var(--cm-border-width));
  --demo-floating-label-active-block: var(--cm-space-1);
  --demo-floating-label-active-translate: 0;
  --demo-floating-label-background: transparent;

  display: grid;
  box-sizing: border-box;
  inline-size: 100%;
  row-gap: var(--cm-space-2);
  color: var(--cm-color-text-primary);
}

.demo-application-floating-field--on {
  --demo-floating-input-padding-top: var(--cm-field-padding-block-md);
  --demo-floating-input-padding-bottom: var(--cm-field-padding-block-md);
  --demo-floating-label-active-block: 0;
  --demo-floating-label-active-translate: -50%;
  --demo-floating-label-background: var(--cm-color-background-surface);

  padding-block-start: calc(var(--cm-space-1) + var(--cm-border-width) * 2);
}

.demo-application-floating-field--over {
  --demo-floating-input-padding-top: var(--cm-field-padding-block-md);
  --demo-floating-input-padding-bottom: var(--cm-field-padding-block-md);
  --demo-floating-label-active-block: calc(-1 * var(--cm-border-width));
  --demo-floating-label-active-translate: -100%;
  --demo-floating-label-background: transparent;

  padding-block-start: calc(var(--cm-space-3) - var(--cm-border-width));
}

.demo-application-floating-field__control {
  position: relative;
  display: grid;
  min-inline-size: 0;
}

.demo-application-floating-field__label {
  position: absolute;
  z-index: 2;
  inset-block-start: 50%;
  inset-inline-start: var(--cm-field-padding-inline-md);
  display: inline-flex;
  align-items: center;
  max-inline-size: calc(100% - var(--cm-field-padding-inline-md) * 2);
  overflow: hidden;
  padding-inline: 0;
  background: transparent;
  color: var(--cm-color-text-placeholder);
  font-size: var(--cm-font-size-xl);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
  transform: translateY(-50%);
  transform-origin: left top;
  transition:
    inset-block-start var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    font-size var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    transform var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.demo-application-floating-field--active .demo-application-floating-field__label {
  inset-block-start: var(--demo-floating-label-active-block);
  padding-inline: var(--cm-space-1);
  background: var(--demo-floating-label-background);
  font-size: var(--cm-font-size-sm);
  line-height: var(--cm-line-height-normal);
  transform: translateY(var(--demo-floating-label-active-translate));
}

.demo-application-floating-field--in.demo-application-floating-field--active .demo-application-floating-field__label {
  padding-inline: 0;
}

.demo-application-floating-field--over.demo-application-floating-field--active .demo-application-floating-field__label {
  padding-inline: 0;
}

.demo-application-floating-field:focus-within:not(.demo-application-floating-field--invalid)
  .demo-application-floating-field__label {
  color: var(--cm-color-interactive-primary-subtle-foreground);
}

/* stylelint-disable-next-line no-descending-specificity -- Invalid color must win after active variant geometry. */
.demo-application-floating-field--invalid .demo-application-floating-field__label,
.demo-application-floating-field__required,
.demo-application-floating-field__error {
  color: var(--cm-color-status-danger-subtle-foreground);
}

.demo-application-floating-field__required {
  flex-shrink: 0;
  margin-inline-start: calc(var(--cm-space-2) / 2);
}

.demo-application-floating-field__description,
.demo-application-floating-field__error {
  margin: 0;
  font-size: var(--cm-font-size-sm);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
}

.demo-application-floating-field__description {
  color: var(--cm-color-text-secondary);
}

.demo-application-floating-field--in .demo-application-floating-field__control :deep(textarea) {
  padding-block-start: calc(var(--cm-space-5) + var(--cm-space-1) + var(--cm-border-width) * 2);
}

.demo-application-floating-field--in .demo-application-floating-field__control :deep(.cm-textarea--sm) {
  padding-block-start: calc(var(--cm-space-5) + var(--cm-space-1));
}

.demo-application-floating-field--on .demo-application-floating-field__control :deep(textarea) {
  padding-block-start: 7px;
}

.demo-application-floating-field--over .demo-application-floating-field__control :deep(textarea) {
  padding-block-start: 5px;
}

.demo-application-floating-field__control :deep(textarea)::placeholder {
  color: transparent;
}

.demo-application-floating-field:not(.demo-application-floating-field--active):has(.cm-textarea--sm)
  .demo-application-floating-field__label {
  inset-block-start: 7px;
  transform: none;
}

.demo-application-floating-field:not(.demo-application-floating-field--active):has(.cm-textarea--md)
  .demo-application-floating-field__label {
  inset-block-start: 8px;
  transform: none;
}

.demo-application-floating-field:not(.demo-application-floating-field--active):has(.cm-textarea--lg)
  .demo-application-floating-field__label {
  inset-block-start: 13px;
  transform: none;
}

/* stylelint-disable-next-line no-descending-specificity -- Unsupported fallback must win after floating geometry. */
.demo-application-floating-field--unsupported .demo-application-floating-field__label {
  position: static;
  grid-row: 1;
  margin-block-end: var(--cm-space-2);
  color: var(--cm-color-text-primary);
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .demo-application-floating-field__label {
    transition-duration: 0.01ms;
  }
}
</style>
