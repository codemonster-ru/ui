<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useAttrs, useSlots, watch } from 'vue';
import { VueIconify, icons, type IconName } from '@codemonster-ru/vueforge-icons';
import VfIconButton from '@/components/icon-button/VfIconButton.vue';
import { cx } from '@/utils/classes';
import type { VfControlSize } from '@/types/components';
import { vfFieldContextKey } from '@/components/field/context';

defineOptions({
  inheritAttrs: false,
});

interface VfInputProps {
  modelValue?: string;
  size?: VfControlSize;
  invalid?: boolean;
  leadingIcon?: IconName | string;
  trailingIcon?: IconName | string;
  clearable?: boolean;
  passwordReveal?: boolean;
}

const props = withDefaults(defineProps<VfInputProps>(), {
  modelValue: '',
  size: 'md',
  invalid: false,
  leadingIcon: undefined,
  trailingIcon: undefined,
  clearable: false,
  passwordReveal: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();
const slots = useSlots();
const inputRef = ref<HTMLInputElement | null>(null);
const passwordVisible = ref(false);
const currentValue = ref(props.modelValue);
const fieldContext = inject(vfFieldContextKey, null);

fieldContext?.setFloatingSupported(true);

watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);

function isTruthyBooleanAttr(value: unknown): boolean {
  return value === true || value === '' || value === 'true';
}

const isDisabled = computed(() => isTruthyBooleanAttr(attrs.disabled));
const isReadonly = computed(() => isTruthyBooleanAttr(attrs.readonly));
const hasValue = computed(() => String(currentValue.value ?? '').length > 0);
const inputType = computed(() => (typeof attrs.type === 'string' ? attrs.type : undefined));
const hasPasswordRevealControl = computed(() => Boolean(props.passwordReveal) && inputType.value === 'password');
const resolvedInputType = computed(() =>
  hasPasswordRevealControl.value && passwordVisible.value ? 'text' : inputType.value,
);

const hasLeadingAdornment = computed(() => Boolean(props.leadingIcon) || Boolean(slots.leading));
const hasTrailingAdornment = computed(() => Boolean(props.trailingIcon) || Boolean(slots.trailing));
const hasClearControl = computed(
  () => Boolean(props.clearable) && hasValue.value && !isDisabled.value && !isReadonly.value,
);
const hasTrailingActionControl = computed(() => hasPasswordRevealControl.value || hasClearControl.value);
const hasTrailingControl = computed(() => hasTrailingAdornment.value || hasTrailingActionControl.value);
const hasAdornments = computed(() => hasLeadingAdornment.value || hasTrailingControl.value);
const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');

const externalClass = computed(() => attrs.class);
const externalStyle = computed(() => attrs.style);
const forwardedInputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style' && key !== 'type')),
);
const passwordRevealLabel = computed(() => (passwordVisible.value ? 'Hide password' : 'Show password'));
const passwordRevealIcon = computed(() => (passwordVisible.value ? icons.eyeSlash : icons.eye));

const inputClasses = computed(() =>
  cx(
    'vf-input',
    props.size !== 'md' && `vf-input--${props.size}`,
    props.invalid && 'vf-input--invalid',
    hasLeadingAdornment.value && 'vf-input--with-leading',
    hasTrailingControl.value && 'vf-input--with-trailing',
    isFloatingLabel.value && 'vf-input--floating',
  ),
);

const wrapperClasses = computed(() =>
  cx(
    'vf-input-wrap',
    props.size !== 'md' && `vf-input-wrap--${props.size}`,
    props.invalid && 'vf-input-wrap--invalid',
    hasLeadingAdornment.value && 'vf-input-wrap--with-leading',
    hasTrailingControl.value && 'vf-input-wrap--with-trailing',
    hasTrailingAdornment.value && hasTrailingActionControl.value && 'vf-input-wrap--with-trailing-and-clear',
    hasTrailingAdornment.value &&
      hasPasswordRevealControl.value &&
      hasClearControl.value &&
      'vf-input-wrap--with-trailing-password-and-clear',
    isFloatingLabel.value && 'vf-input-wrap--floating',
  ),
);

watch(
  hasValue,
  (value) => {
    fieldContext?.setFilled(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  fieldContext?.setFloatingSupported(false);
  fieldContext?.setFilled(false);
});

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  currentValue.value = value;
  emit('update:modelValue', value);
}

function handleClear() {
  currentValue.value = '';
  emit('update:modelValue', '');
  inputRef.value?.focus();
}

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value;
  inputRef.value?.focus();
}
</script>

<template>
  <div v-if="hasAdornments" :class="[wrapperClasses, externalClass]" :style="externalStyle">
    <span v-if="hasLeadingAdornment" class="vf-input-wrap__icon vf-input-wrap__icon--leading" aria-hidden="true">
      <slot name="leading">
        <VueIconify v-if="props.leadingIcon" :icon="props.leadingIcon" size="var(--vf-field-icon-size)" />
      </slot>
    </span>

    <input
      ref="inputRef"
      :class="inputClasses"
      :data-vf-filled="hasValue || undefined"
      :value="currentValue"
      :type="resolvedInputType"
      :aria-invalid="props.invalid || undefined"
      v-bind="forwardedInputAttrs"
      @input="handleInput"
    />

    <span
      v-if="hasTrailingAdornment"
      class="vf-input-wrap__icon vf-input-wrap__icon--trailing"
      :class="(hasPasswordRevealControl || hasClearControl) && 'vf-input-wrap__icon--trailing-before-clear'"
      aria-hidden="true"
    >
      <slot name="trailing">
        <VueIconify v-if="props.trailingIcon" :icon="props.trailingIcon" size="var(--vf-field-icon-size)" />
      </slot>
    </span>

    <VfIconButton
      v-if="hasPasswordRevealControl"
      class="vf-input-wrap__password-toggle"
      :class="hasClearControl && 'vf-input-wrap__password-toggle--before-clear'"
      :icon="passwordRevealIcon"
      variant="ghost"
      size="sm"
      :aria-label="passwordRevealLabel"
      :aria-pressed="passwordVisible"
      @mousedown.prevent
      @click="togglePasswordVisibility"
    />

    <VfIconButton
      v-if="hasClearControl"
      class="vf-input-wrap__clear"
      :icon="icons.xmark"
      variant="ghost"
      size="sm"
      aria-label="Clear input"
      @mousedown.prevent
      @click="handleClear"
    />
  </div>

  <input
    v-else
    ref="inputRef"
    :class="[inputClasses, externalClass]"
    :data-vf-filled="hasValue || undefined"
    :value="currentValue"
    :type="resolvedInputType"
    :aria-invalid="props.invalid || undefined"
    v-bind="forwardedInputAttrs"
    @input="handleInput"
  />
</template>
