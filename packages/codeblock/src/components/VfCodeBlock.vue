<!-- eslint-disable vue/no-v-html -->
<template>
  <section
    ref="rootElement"
    class="vf-codeblock"
    :class="{ 'vf-codeblock--disabled': disabled }"
    :style="rootStyle"
    :data-theme="themeAttribute"
    :data-vf-theme="themeAttribute"
    :data-vf-resolved-theme="resolvedTheme"
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
              data-allow-mismatch="children"
              v-html="renderedLines[index] ?? ''"
              /></span></code></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { computed, inject, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue';
import { CODE_BLOCK_LANGUAGE_OPTIONS_KEY } from '../config';
import { renderPlainCodeLines } from '../utils/plain-code';
import type { CodeBlockCopyPayload, CodeBlockLanguageRuntimeOptions, CodeBlockProps } from '../types';
import { SUPPORTED_CODE_BLOCK_LANGUAGES } from '../types';

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
  containerMinHeight: '',
  minHeight: '',
  maxHeight: '',
  ariaLabel: 'Code block',
  theme: 'inherit',
  languageFallback: 'plaintext',
});

const emits = defineEmits<{
  (event: 'copy', payload: CodeBlockCopyPayload): void;
  (event: 'ready'): void;
}>();

const copied = ref(false);
const rootElement = ref<HTMLElement | null>(null);
const inheritedTheme = ref<'light' | 'dark'>('light');
const renderedLines = ref<string[]>(renderPlainCodeLines(props.code));
let copiedTimer: ReturnType<typeof setTimeout> | null = null;
let themeObserver: MutationObserver | null = null;
let renderRequestId = 0;
let readyEmitted = false;
let highlightRuntimePromise: Promise<typeof import('../highlight')> | null = null;
const pluginLanguageOptions = inject<CodeBlockLanguageRuntimeOptions>(CODE_BLOCK_LANGUAGE_OPTIONS_KEY, {});

const normalizedCode = computed(() => props.code.replace(/\r\n/g, '\n'));
const effectiveAllowedLanguages = computed(
  () => props.allowedLanguages ?? pluginLanguageOptions.allowedLanguages ?? [...SUPPORTED_CODE_BLOCK_LANGUAGES],
);
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
const themeAttribute = computed(() => (props.theme === 'inherit' ? 'inherit' : resolvedTheme.value));

const preStyle = computed(() => {
  const style: Record<string, string> = {};

  style['--vf-codeblock-line-number-width'] = lineNumberWidth.value;

  if (props.maxHeight) {
    style.maxHeight = props.maxHeight;
  }

  if (props.minHeight) {
    style.minHeight = props.minHeight;
  }

  return style;
});

const rootStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.containerMinHeight) {
    style.minHeight = props.containerMinHeight;
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

const loadHighlightRuntime = () => {
  highlightRuntimePromise ??= import('../highlight');
  return highlightRuntimePromise;
};

const renderHighlight = async (
  code = normalizedCode.value,
  language = props.language,
  highlight = props.highlight,
  theme = resolvedTheme.value,
) => {
  const requestId = (renderRequestId += 1);

  try {
    if (!highlight) {
      renderedLines.value = renderPlainCodeLines(code);
      return;
    }

    const hasHighlightedCode = renderedLines.value.some((line) => line.includes('vf-codeblock__shiki-token'));

    if (!hasHighlightedCode) {
      renderedLines.value = renderPlainCodeLines(code);
    }

    const { highlightCodeLines } = await loadHighlightRuntime();
    const highlightedLines = await highlightCodeLines(language, code, theme, highlight, {
      allowedLanguages: effectiveAllowedLanguages.value,
      fallbackLanguage: props.languageFallback,
    });

    if (requestId === renderRequestId) {
      renderedLines.value = highlightedLines;
    }
  } catch (error) {
    if (requestId === renderRequestId) {
      renderedLines.value = renderPlainCodeLines(code);
    }
    if (import.meta.env.DEV) {
      console.warn('[VfCodeBlock] Highlight runtime failed, rendering plain code fallback.', error);
    }
  } finally {
    emitReadyOnce();
  }
};

const emitReadyOnce = () => {
  if (readyEmitted || typeof window === 'undefined') {
    return;
  }
  readyEmitted = true;
  emits('ready');
};

onServerPrefetch(() => renderHighlight());

watch(
  [normalizedCode, () => props.language, () => props.highlight, resolvedTheme],
  ([code, language, highlight, theme]) => renderHighlight(code, language, highlight, theme),
  { immediate: true },
);

const normalizeThemeValue = (value: string | null): 'light' | 'dark' | null => {
  return value === 'light' || value === 'dark' ? value : null;
};

const findClosestThemeValue = (element: HTMLElement | null) => {
  let currentElement = element?.parentElement ?? null;

  while (currentElement) {
    const dataTheme = normalizeThemeValue(currentElement.getAttribute('data-theme'));
    if (dataTheme) {
      return dataTheme;
    }

    const dataVfTheme = normalizeThemeValue(currentElement.getAttribute('data-vf-theme'));
    if (dataVfTheme) {
      return dataVfTheme;
    }

    currentElement = currentElement.parentElement;
  }

  return null;
};

const syncInheritedTheme = () => {
  if (props.theme !== 'inherit') {
    return;
  }

  inheritedTheme.value = findClosestThemeValue(rootElement.value) ?? 'light';
};

const syncServerRenderedHighlight = () => {
  const root = rootElement.value;
  if (!root?.querySelector('.vf-codeblock__line-content > .vf-codeblock__shiki-token')) {
    return;
  }

  const serverRenderedLines = Array.from(root.querySelectorAll<HTMLElement>('.vf-codeblock__line-content')).map(
    (line) => line.innerHTML,
  );

  if (serverRenderedLines.length === lines.value.length) {
    renderedLines.value = serverRenderedLines;
  }
};

watch(
  () => props.theme,
  (theme) => {
    if (theme === 'inherit') {
      syncInheritedTheme();
    }
  },
);

onMounted(() => {
  // Hydration starts with the lightweight client fallback while SSR can already contain Shiki output.
  // Reconcile the reactive state with that narrowly-scoped server output before subsequent updates.
  syncServerRenderedHighlight();
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

<style src="../codeblock.css"></style>
