<script lang="ts">
export type CoreInputSize = 'sm' | 'md' | 'lg';
</script>

<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useSlots, watch, type PropType } from 'vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import '@codemonster-ru/ui-css/input.css';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String as PropType<'text' | 'email' | 'password' | 'search' | 'tel' | 'url'>, default: 'text' },
  size: {
    type: String as PropType<CoreInputSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  leadingIcon: { type: String as PropType<IconName | string>, default: undefined },
  trailingIcon: { type: String as PropType<IconName | string>, default: undefined },
  clearable: Boolean,
  passwordReveal: Boolean,
  floating: Boolean,
  clearLabel: { type: String, default: 'Clear input' },
  showPasswordLabel: { type: String, default: 'Show password' },
  hidePasswordLabel: { type: String, default: 'Hide password' },
  actionLabel: { type: String, default: undefined },
});

const emit = defineEmits<{
  action: [];
  input: [event: Event];
  'update:modelValue': [value: string];
}>();

const slots = useSlots();
const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const currentValue = ref(props.modelValue);
const passwordVisible = ref(false);

watch(
  () => props.modelValue,
  (value) => (currentValue.value = value),
);

const hasLeading = computed(() => Boolean(props.leadingIcon || slots.leading));
const hasTrailing = computed(() => Boolean(props.trailingIcon || slots.trailing));
const hasPasswordReveal = computed(() => props.passwordReveal && props.type === 'password');
const hasClear = computed(() => props.clearable && currentValue.value.length > 0 && !props.disabled && !props.readonly);
const hasCustomAction = computed(() => Boolean(props.actionLabel && slots.action));
const actionCount = computed(
  () => Number(hasPasswordReveal.value) + Number(hasCustomAction.value) + Number(hasClear.value),
);
const resolvedType = computed(() => (hasPasswordReveal.value && passwordVisible.value ? 'text' : props.type));
const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...inputAttrs } = attrs;
  return inputAttrs;
});

function updateValue(event: Event): void {
  currentValue.value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', currentValue.value);
  emit('input', event);
}

function clearValue(): void {
  currentValue.value = '';
  emit('update:modelValue', '');
  inputRef.value?.focus();
}

async function togglePassword(): Promise<void> {
  const input = inputRef.value;
  const selection = input?.selectionStart === null ? null : [input?.selectionStart ?? 0, input?.selectionEnd ?? 0];
  passwordVisible.value = !passwordVisible.value;
  await nextTick();
  inputRef.value?.focus();
  if (selection) inputRef.value?.setSelectionRange(selection[0], selection[1]);
}
</script>

<template>
  <div
    class="cm-input-wrap demo-application-input"
    :class="[
      `demo-application-input--${props.size}`,
      props.floating && 'demo-application-input--floating',
      hasLeading && 'demo-application-input--leading',
      hasTrailing && 'demo-application-input--trailing',
      `demo-application-input--actions-${actionCount}`,
      attrs.class,
    ]"
    :style="attrs.style"
    :data-cm-filled="currentValue.length > 0 || undefined"
  >
    <span v-if="hasLeading" class="cm-input__leading demo-application-input__icon" aria-hidden="true">
      <slot name="leading">
        <VueIconify :icon="props.leadingIcon!" />
      </slot>
    </span>

    <input
      ref="inputRef"
      v-bind="forwardedAttrs"
      class="cm-input"
      :class="[`cm-input--${props.size}`, props.invalid && 'cm-input--invalid']"
      :type="resolvedType"
      :value="currentValue"
      :disabled="props.disabled || undefined"
      :readonly="props.readonly || undefined"
      :required="props.required || undefined"
      :aria-invalid="props.invalid ? 'true' : undefined"
      @input="updateValue"
    />

    <span v-if="hasTrailing" class="cm-input__trailing demo-application-input__icon" aria-hidden="true">
      <slot name="trailing">
        <VueIconify :icon="props.trailingIcon!" />
      </slot>
    </span>

    <span v-if="actionCount" class="demo-application-input__actions">
      <button
        v-if="hasPasswordReveal"
        class="cm-input__action demo-application-input__action"
        type="button"
        :aria-label="passwordVisible ? props.hidePasswordLabel : props.showPasswordLabel"
        :aria-pressed="passwordVisible"
        @mousedown.prevent
        @click="togglePassword"
      >
        <VueIconify :icon="passwordVisible ? 'eyeSlash' : 'eye'" aria-hidden="true" />
      </button>
      <button
        v-if="hasCustomAction"
        class="cm-input__action demo-application-input__action"
        type="button"
        :aria-label="props.actionLabel"
        @mousedown.prevent
        @click="emit('action')"
      >
        <span aria-hidden="true"><slot name="action" /></span>
      </button>
      <button
        v-if="hasClear"
        class="cm-input__action demo-application-input__action"
        type="button"
        :aria-label="props.clearLabel"
        @mousedown.prevent
        @click="clearValue"
      >
        <VueIconify icon="xmark" aria-hidden="true" />
      </button>
    </span>
  </div>
</template>

<style scoped>
.demo-application-input {
  --demo-input-action-size: 1.375rem;
  --demo-input-action-gap: var(--cm-space-1);
  --demo-input-actions-width: 0rem;
  --demo-input-adornment-offset: 0.625rem;
  --demo-input-trailing-width: calc(var(--cm-space-2) * 2 + var(--cm-icon-size-md));

  position: relative;
}

.demo-application-input--sm {
  --demo-input-action-size: 1.25rem;
  --demo-input-adornment-offset: var(--cm-space-2);
}

.demo-application-input--lg {
  --demo-input-action-size: var(--cm-icon-size-xl);
}

.demo-application-input__icon {
  inline-size: var(--cm-icon-size-md);
  block-size: var(--cm-icon-size-md);
  pointer-events: none;
}

.demo-application-input--sm .demo-application-input__icon {
  inline-size: var(--cm-icon-size-sm);
  block-size: var(--cm-icon-size-sm);
}

.demo-application-input--lg .demo-application-input__icon {
  inline-size: var(--cm-icon-size-lg);
  block-size: var(--cm-icon-size-lg);
}

.demo-application-input__icon :deep(svg),
.demo-application-input__action :deep(svg) {
  inline-size: 100%;
  block-size: 100%;
}

.demo-application-input__actions {
  position: absolute;
  z-index: 1;
  inset-block-start: 50%;
  inset-inline-end: var(--demo-input-adornment-offset);
  display: inline-flex;
  align-items: center;
  gap: var(--demo-input-action-gap);
  transform: translateY(-50%);
}

.demo-application-input__action.cm-input__action {
  position: static;
  inline-size: var(--demo-input-action-size);
  block-size: var(--demo-input-action-size);
  transform: none;
}

.demo-application-input--actions-1 {
  --demo-input-actions-width: var(--demo-input-action-size);
}

.demo-application-input--actions-2 {
  --demo-input-actions-width: calc(var(--demo-input-action-size) * 2 + var(--demo-input-action-gap));
}

.demo-application-input--actions-3 {
  --demo-input-actions-width: calc(var(--demo-input-action-size) * 3 + var(--demo-input-action-gap) * 2);
}

.demo-application-input--floating .cm-input::placeholder {
  color: transparent;
}

.demo-application-input--floating .cm-input {
  padding-block: calc(var(--cm-space-3) + var(--cm-space-1)) var(--cm-space-1);
}

.demo-application-input--floating .cm-input--sm {
  min-block-size: var(--cm-control-height-md);
  padding-block: var(--cm-space-3) var(--cm-space-1);
}

.demo-application-input--floating .cm-input--lg {
  padding-block: calc(var(--cm-space-4) + var(--cm-space-1)) var(--cm-space-2);
}

.demo-application-input:not(.demo-application-input--actions-0) .cm-input {
  padding-inline-end: calc(var(--demo-input-adornment-offset) + var(--demo-input-actions-width) + var(--cm-space-2));
}

.demo-application-input--trailing:not(.demo-application-input--actions-0) .cm-input__trailing {
  inset-inline-end: calc(var(--demo-input-adornment-offset) + var(--demo-input-actions-width) + var(--cm-space-2));
}

.demo-application-input--trailing:not(.demo-application-input--actions-0) .cm-input {
  padding-inline-end: calc(
    var(--demo-input-adornment-offset) + var(--demo-input-actions-width) + var(--demo-input-trailing-width)
  );
}
</style>
