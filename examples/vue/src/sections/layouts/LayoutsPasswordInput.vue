<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, watch } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

defineOptions({
  inheritAttrs: false,
});

interface LayoutsPasswordInputProps {
  modelValue?: string;
  invalid?: boolean;
}

const props = withDefaults(defineProps<LayoutsPasswordInputProps>(), {
  modelValue: '',
  invalid: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const passwordVisible = ref(false);
const currentValue = ref(props.modelValue);
const inputSelection = ref<{
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
} | null>(null);

const externalClass = computed(() => attrs.class);
const externalStyle = computed(() => attrs.style);
const forwardedInputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style' && key !== 'type')),
);
const passwordRevealLabel = computed(() => (passwordVisible.value ? 'Hide password' : 'Show password'));
const passwordRevealIcon = computed(() => (passwordVisible.value ? icons.eyeSlash : icons.eye));

watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);

function saveInputSelection(input = inputRef.value) {
  if (!input || input.selectionStart === null || input.selectionEnd === null) return;

  inputSelection.value = {
    start: input.selectionStart,
    end: input.selectionEnd,
    direction: input.selectionDirection ?? 'none',
  };
}

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement;
  currentValue.value = input.value;
  saveInputSelection(input);
  emit('update:modelValue', input.value);
}

function restoreInputSelection(selection: NonNullable<typeof inputSelection.value>) {
  const input = inputRef.value;
  if (!input) return;

  input.focus();
  input.setSelectionRange(selection.start, selection.end, selection.direction);
}

async function togglePasswordVisibility() {
  saveInputSelection();
  const selection = inputSelection.value;
  passwordVisible.value = !passwordVisible.value;

  await nextTick();

  if (!selection) {
    inputRef.value?.focus();
    return;
  }

  restoreInputSelection(selection);
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  restoreInputSelection(selection);
}
</script>

<template>
  <div :class="['cm-input-wrap', externalClass]" :style="externalStyle">
    <input
      ref="inputRef"
      class="cm-input cm-input--md"
      :class="props.invalid && 'cm-input--invalid'"
      :value="currentValue"
      :type="passwordVisible ? 'text' : 'password'"
      :aria-invalid="props.invalid || undefined"
      v-bind="forwardedInputAttrs"
      @input="handleInput"
      @click="saveInputSelection()"
      @keyup="saveInputSelection()"
      @select="saveInputSelection()"
    />

    <button
      class="cm-input__action"
      type="button"
      :aria-label="passwordRevealLabel"
      :aria-pressed="passwordVisible"
      @pointerdown.prevent="saveInputSelection()"
      @mousedown.prevent
      @click="togglePasswordVisibility"
    >
      <VueIconify :icon="passwordRevealIcon" size="var(--cm-icon-size-md)" aria-hidden="true" />
    </button>
  </div>
</template>
