<!-- eslint-disable vue/no-v-html -->
<template>
  <section
    ref="rootElement"
    class="vf-codeblock"
    :class="{ 'vf-codeblock--disabled': disabled }"
    :data-theme="resolvedTheme"
    :aria-label="ariaLabel"
  >
    <header v-if="showHeader || $slots.actions" class="vf-codeblock__header">
      <div v-if="showHeader" class="vf-codeblock__meta">
        <span v-if="filename" class="vf-codeblock__filename">{{ filename }}</span>
        <span class="vf-codeblock__language">{{ languageLabel }}: {{ language }}</span>
      </div>
      <div class="vf-codeblock__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="vf-codeblock__code-shell">
      <button
        v-if="copyable"
        type="button"
        class="vf-codeblock__copy"
        :disabled="disabled"
        :aria-label="copied ? copiedLabel : copyLabel"
        :title="copied ? copiedLabel : copyLabel"
        @click="copyCurrentCode"
      >
        <VueIconify class="vf-codeblock__copy-icon" :icon="copied ? icons.check : icons.copy" aria-hidden="true" />
      </button>
      <pre class="vf-codeblock__pre" :class="{ 'vf-codeblock__pre--wrap': wrap }" :style="preStyle"><code><span
              v-for="(line, index) in lines"
              :key="index"
              class="vf-codeblock__line"
          ><span v-if="showLineNumbers" class="vf-codeblock__line-number">{{ index + 1 }}</span><span
                  class="vf-codeblock__line-content"
                  v-html="renderedLines[index] ?? ''"
              /></span></code></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { computed, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue';
import { highlightCodeLines, renderPlainCodeLines } from '../services/code-highlight';
import type { CodeBlockCopyPayload, CodeBlockProps } from '../types';

defineOptions({ name: 'VfCodeBlock' });

const props = withDefaults(defineProps<CodeBlockProps>(), {
  code: '',
  language: 'plaintext',
  filename: '',
  showHeader: true,
  showLineNumbers: false,
  copyable: true,
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  copiedDuration: 1200,
  languageLabel: 'Language',
  disabled: false,
  wrap: false,
  highlight: true,
  maxHeight: '',
  ariaLabel: 'Code block',
  theme: 'inherit',
});

const emits = defineEmits<{
  (event: 'copy', payload: CodeBlockCopyPayload): void;
}>();

const copied = ref(false);
const rootElement = ref<HTMLElement | null>(null);
const inheritedTheme = ref<'light' | 'dark'>('light');
const renderedLines = ref<string[]>(renderPlainCodeLines(props.code));
let copiedTimer: ReturnType<typeof setTimeout> | null = null;
let themeObserver: MutationObserver | null = null;
let renderRequestId = 0;

const normalizedCode = computed(() => props.code.replace(/\r\n/g, '\n'));
const lines = computed(() => {
  if (!normalizedCode.value) {
    return [''];
  }

  return normalizedCode.value.split('\n');
});

const lineNumberWidth = computed(() => {
  const digitCount = Math.max(1, String(lines.value.length).length);

  return `${digitCount}ch`;
});

const resolvedTheme = computed(() => (props.theme === 'inherit' ? inheritedTheme.value : props.theme));

const preStyle = computed(() => {
  const style: Record<string, string> = {};

  style['--vf-codeblock-line-number-width'] = lineNumberWidth.value;

  if (props.maxHeight) {
    style.maxHeight = props.maxHeight;
  }

  return style;
});

const copyCurrentCode = async () => {
  if (props.disabled) {
    return;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalizedCode.value);
    }
  } finally {
    emits('copy', { text: normalizedCode.value });

    copied.value = true;
    if (copiedTimer) {
      clearTimeout(copiedTimer);
    }
    copiedTimer = setTimeout(() => {
      copied.value = false;
      copiedTimer = null;
    }, props.copiedDuration);
  }
};

const renderHighlight = async (
  code = normalizedCode.value,
  language = props.language,
  highlight = props.highlight,
  theme = resolvedTheme.value,
) => {
  const requestId = (renderRequestId += 1);

  if (!highlight) {
    renderedLines.value = renderPlainCodeLines(code);
    return;
  }

  const hasHighlightedCode = renderedLines.value.some((line) => line.includes('vf-codeblock__shiki-token'));

  if (!hasHighlightedCode) {
    renderedLines.value = renderPlainCodeLines(code);
  }

  const highlightedLines = await highlightCodeLines(language, code, theme, highlight);

  if (requestId === renderRequestId) {
    renderedLines.value = highlightedLines;
  }
};

onServerPrefetch(() => renderHighlight());

watch(
  [normalizedCode, () => props.language, () => props.highlight, resolvedTheme],
  ([code, language, highlight, theme]) => renderHighlight(code, language, highlight, theme),
  { immediate: true },
);

const normalizeThemeValue = (value: string | null) => (value === 'dark' ? 'dark' : 'light');

const findClosestThemeValue = (element: HTMLElement | null, attributeName: 'data-theme' | 'data-vf-theme') => {
  let currentElement = element?.parentElement ?? null;

  while (currentElement) {
    if (currentElement.hasAttribute(attributeName)) {
      return normalizeThemeValue(currentElement.getAttribute(attributeName));
    }

    currentElement = currentElement.parentElement;
  }

  return null;
};

const syncInheritedTheme = () => {
  if (props.theme !== 'inherit') {
    return;
  }

  inheritedTheme.value =
    findClosestThemeValue(rootElement.value, 'data-theme') ??
    findClosestThemeValue(rootElement.value, 'data-vf-theme') ??
    'light';
};

onMounted(() => {
  syncInheritedTheme();

  if (typeof MutationObserver === 'undefined' || !rootElement.value) {
    return;
  }

  themeObserver = new MutationObserver(() => {
    syncInheritedTheme();
  });

  themeObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-theme', 'data-vf-theme'],
  });
});

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer);
    copiedTimer = null;
  }

  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
});
</script>

<style lang="scss">
.vf-codeblock {
  --vf-codeblock-margin-block: var(--vf-surface-padding);
  --vf-codeblock-margin-block-start: var(--vf-codeblock-margin-block);
  --vf-codeblock-margin-block-end: var(--vf-codeblock-margin-block);
  --vf-codeblock-gap: 0;
  --vf-codeblock-border-color: var(--vf-color-border);
  --vf-codeblock-border-radius: var(--vf-radius-surface);
  --vf-codeblock-background-color: var(--vf-color-surface);
  --vf-codeblock-text-color: var(--vf-color-text);
  --vf-codeblock-font-family: var(--vf-font-family-mono);
  --vf-codeblock-font-size: var(--vf-text-caption-font-size);
  --vf-codeblock-line-height: var(--vf-text-body-line-height);
  --vf-codeblock-header-gap: var(--vf-surface-gap);
  --vf-codeblock-header-padding: var(--vf-codeblock-padding);
  --vf-codeblock-header-border-color: var(--vf-color-border);
  --vf-codeblock-header-background-color: var(--vf-codeblock-background-color);
  --vf-codeblock-header-opacity: 0.9;
  --vf-codeblock-meta-gap: var(--vf-surface-gap-compact);
  --vf-codeblock-meta-color: var(--vf-color-muted);
  --vf-codeblock-meta-font-size: var(--vf-text-label-font-size);
  --vf-codeblock-filename-color: var(--vf-color-text);
  --vf-codeblock-filename-font-weight: var(--vf-font-weight-semibold);
  --vf-codeblock-actions-gap: var(--vf-surface-gap-compact);
  --vf-codeblock-action-border-color: var(--vf-color-border);
  --vf-codeblock-action-border-radius: var(--vf-radius-control-tight);
  --vf-codeblock-action-background-color: var(--vf-color-surface);
  --vf-codeblock-action-text-color: var(--vf-color-text);
  --vf-codeblock-action-font-size: var(--vf-text-label-font-size);
  --vf-codeblock-action-padding: var(--vf-field-padding-sm);
  --vf-codeblock-action-font-weight: var(--vf-text-body-font-weight);
  --vf-codeblock-action-opacity: 0.88;
  --vf-codeblock-copy-color: var(--vf-codeblock-line-number-color);
  --vf-codeblock-copy-hover-color: var(--vf-codeblock-action-text-color);
  --vf-codeblock-copy-offset: var(--vf-surface-padding-compact);
  --vf-codeblock-copy-z-index: 1;
  --vf-codeblock-copy-line-height: var(--vf-line-height-tight);
  --vf-codeblock-copy-icon-size: var(--vf-icon-size-md);
  --vf-codeblock-copy-hidden-opacity: 0;
  --vf-codeblock-copy-visible-opacity: 1;
  --vf-codeblock-copy-transition-duration: var(--vf-motion-duration-fast);
  --vf-codeblock-copy-color-transition-duration: var(--vf-motion-duration-fast);
  --vf-codeblock-copy-transition-easing: var(--vf-motion-ease-standard);
  --vf-codeblock-padding: var(--vf-surface-padding-compact);
  --vf-codeblock-max-height: min(60vh, var(--vf-breakpoint-sm));
  --vf-codeblock-code-background-color: transparent;
  --vf-codeblock-line-gap: var(--vf-surface-gap);
  --vf-codeblock-line-number-color: var(--vf-color-muted);
  --vf-codeblock-line-number-min-width: 1ch;
  --vf-codeblock-line-number-width: var(--vf-codeblock-line-number-min-width);
  --vf-codeblock-shadow: var(--vf-shadow);
  --vf-codeblock-disabled-opacity: 0.6;

  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  margin-block: var(--vf-codeblock-margin-block-start) var(--vf-codeblock-margin-block-end);
  gap: var(--vf-codeblock-gap);
  border: 1px solid var(--vf-codeblock-border-color);
  border-radius: var(--vf-codeblock-border-radius);
  background: var(--vf-codeblock-background-color);
  color: var(--vf-codeblock-text-color);
  font-family: var(--vf-codeblock-font-family);
  font-size: var(--vf-codeblock-font-size);
  line-height: var(--vf-codeblock-line-height);
  overflow: hidden;
}

.vf-codeblock:first-child {
  margin-block-start: 0;
}

.vf-codeblock:last-child {
  margin-block-end: 0;
}

.vf-codeblock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--vf-codeblock-header-gap);
  min-height: 0;
  padding: var(--vf-codeblock-header-padding);
  border-bottom: 1px solid var(--vf-codeblock-header-border-color);
  background: var(--vf-codeblock-header-background-color);
  opacity: var(--vf-codeblock-header-opacity);
}

.vf-codeblock__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--vf-codeblock-meta-gap);
  color: var(--vf-codeblock-meta-color);
  font-size: var(--vf-codeblock-meta-font-size);
  letter-spacing: 0;
}

.vf-codeblock__filename {
  color: var(--vf-codeblock-filename-color);
  font-weight: var(--vf-codeblock-filename-font-weight);
}

.vf-codeblock__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--vf-codeblock-actions-gap);
}

.vf-codeblock__copy {
  all: unset;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: auto;
  min-width: 0;
  min-height: 0;
  max-width: max-content;
  line-height: var(--vf-codeblock-copy-line-height);
  position: absolute;
  top: var(--vf-codeblock-copy-offset);
  right: var(--vf-codeblock-copy-offset);
  z-index: var(--vf-codeblock-copy-z-index);
  border: 1px solid var(--vf-codeblock-action-border-color);
  border-radius: var(--vf-codeblock-action-border-radius);
  background: var(--vf-codeblock-action-background-color);
  color: var(--vf-codeblock-copy-color);
  padding: var(--vf-codeblock-action-padding);
  font-size: var(--vf-codeblock-action-font-size);
  font-weight: var(--vf-codeblock-action-font-weight);
  opacity: var(--vf-codeblock-copy-hidden-opacity);
  pointer-events: none;
  transition:
    opacity var(--vf-codeblock-copy-transition-duration) var(--vf-codeblock-copy-transition-easing),
    color var(--vf-codeblock-copy-color-transition-duration) var(--vf-codeblock-copy-transition-easing);
  white-space: nowrap;
}

.vf-codeblock__copy:disabled {
  cursor: default;
}

.vf-codeblock__copy-icon {
  display: block;
  width: var(--vf-codeblock-copy-icon-size);
  height: var(--vf-codeblock-copy-icon-size);
}

.vf-codeblock__code-shell {
  position: relative;
}

.vf-codeblock .vf-codeblock__pre {
  margin: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
  padding: var(--vf-codeblock-padding);
  background: var(--vf-codeblock-code-background-color);
  max-height: var(--vf-codeblock-max-height);
  overflow: auto;
  white-space: pre;
}

.vf-codeblock__copy:hover,
.vf-codeblock .vf-codeblock__copy:focus-visible {
  color: var(--vf-codeblock-copy-hover-color);
}

.vf-codeblock .vf-codeblock__code-shell:hover .vf-codeblock__copy,
.vf-codeblock .vf-codeblock__code-shell:focus-within .vf-codeblock__copy {
  opacity: var(--vf-codeblock-copy-visible-opacity);
  pointer-events: auto;
}

.vf-codeblock__pre--wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.vf-codeblock__line {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--vf-codeblock-line-gap);
}

.vf-codeblock__line-number {
  width: var(--vf-codeblock-line-number-width);
  text-align: right;
  color: var(--vf-codeblock-line-number-color);
  min-width: var(--vf-codeblock-line-number-min-width);
  font-variant-numeric: tabular-nums;
  user-select: none;
  white-space: nowrap;
}

.vf-codeblock__line-content {
  min-width: 0;
  white-space: inherit;
}

/* stylelint-disable no-descending-specificity -- Theme selectors intentionally layer explicit, inherited, and fallback modes. */
.vf-codeblock[data-theme='light'],
:root:not([data-theme='dark']) .vf-codeblock:not([data-theme='dark']),
[data-theme='light'] .vf-codeblock,
[data-vf-theme='light'] .vf-codeblock,
:root:not([data-vf-theme='dark']) .vf-codeblock:not([data-theme='dark']) {
  box-shadow: var(--vf-codeblock-shadow);
}

.vf-codeblock[data-theme='dark'],
:root[data-theme='dark'] .vf-codeblock:not([data-theme='light']),
[data-theme='dark'] .vf-codeblock:not([data-theme='light']) {
  --vf-codeblock-background-color: var(--vf-color-surface);
  --vf-codeblock-text-color: var(--vf-color-text);
  --vf-codeblock-border-color: var(--vf-color-border);
  --vf-codeblock-header-border-color: var(--vf-color-border);
  --vf-codeblock-header-background-color: var(--vf-codeblock-background-color);
  --vf-codeblock-meta-color: var(--vf-color-muted);
  --vf-codeblock-filename-color: var(--vf-color-text);
  --vf-codeblock-action-border-color: var(--vf-color-border);
  --vf-codeblock-action-background-color: var(--vf-color-surface);
  --vf-codeblock-action-text-color: var(--vf-color-text);
  --vf-codeblock-line-number-color: var(--vf-color-muted);
}
/* stylelint-enable no-descending-specificity */

.vf-codeblock--disabled {
  opacity: var(--vf-codeblock-disabled-opacity);
}
</style>
