<!-- eslint-disable vue/no-v-html -->
<template>
  <section
    ref="rootElement"
    class="vcb"
    :class="{ 'vcb--disabled': disabled }"
    :data-theme="resolvedTheme"
    :aria-label="ariaLabel"
  >
    <header v-if="showHeader || $slots.actions" class="vcb__header">
      <div v-if="showHeader" class="vcb__meta">
        <span v-if="filename" class="vcb__filename">{{ filename }}</span>
        <span class="vcb__language">{{ languageLabel }}: {{ language }}</span>
      </div>
      <div class="vcb__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="vcb__code-shell">
      <button
        v-if="copyable"
        type="button"
        class="vcb__copy"
        :disabled="disabled"
        :aria-label="copied ? copiedLabel : copyLabel"
        :title="copied ? copiedLabel : copyLabel"
        @click="copyCurrentCode"
      >
        <VueIconify
          class="vcb__copy-icon"
          :icon="copied ? icons.check : icons.copy"
          aria-hidden="true"
        />
      </button>
      <pre
        class="vcb__pre"
        :class="{ 'vcb__pre--wrap': wrap }"
        :style="preStyle"
      ><code><span
              v-for="(line, index) in lines"
              :key="index"
              class="vcb__line"
          ><span v-if="showLineNumbers" class="vcb__line-number">{{ index + 1 }}</span><span
                  class="vcb__line-content"
                  v-html="renderedLines[index] ?? ''"
              /></span></code></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { VueIconify, icons } from "@codemonster-ru/vueforge-icons";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  ref,
  watch,
} from "vue";
import {
  highlightCodeLines,
  renderPlainCodeLines,
} from "../services/code-highlight";
import type { CodeBlockCopyPayload, CodeBlockProps } from "../types";

defineOptions({ name: "VcbCodeBlock" });

const props = withDefaults(defineProps<CodeBlockProps>(), {
  code: "",
  language: "plaintext",
  filename: "",
  showHeader: true,
  showLineNumbers: false,
  copyable: true,
  copyLabel: "Copy",
  copiedLabel: "Copied",
  copiedDuration: 1200,
  languageLabel: "Language",
  disabled: false,
  wrap: false,
  highlight: true,
  maxHeight: "",
  ariaLabel: "Code block",
  theme: "inherit",
});

const emits = defineEmits<{
  (event: "copy", payload: CodeBlockCopyPayload): void;
}>();

const copied = ref(false);
const rootElement = ref<HTMLElement | null>(null);
const inheritedTheme = ref<"light" | "dark">("light");
const renderedLines = ref<string[]>(renderPlainCodeLines(props.code));
let copiedTimer: ReturnType<typeof setTimeout> | null = null;
let themeObserver: MutationObserver | null = null;
let renderRequestId = 0;

const normalizedCode = computed(() => props.code.replace(/\r\n/g, "\n"));
const lines = computed(() => {
  if (!normalizedCode.value) {
    return [""];
  }

  return normalizedCode.value.split("\n");
});

const lineNumberWidth = computed(() => {
  const digitCount = Math.max(1, String(lines.value.length).length);

  return `${digitCount}ch`;
});

const resolvedTheme = computed(() =>
  props.theme === "inherit" ? inheritedTheme.value : props.theme,
);

const preStyle = computed(() => {
  const style: Record<string, string> = {};

  style["--vcb-line-number-width"] = lineNumberWidth.value;

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
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalizedCode.value);
    }
  } finally {
    emits("copy", { text: normalizedCode.value });

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

  const hasHighlightedCode = renderedLines.value.some((line) =>
    line.includes("vcb__shiki-token"),
  );

  if (!hasHighlightedCode) {
    renderedLines.value = renderPlainCodeLines(code);
  }

  const highlightedLines = await highlightCodeLines(
    language,
    code,
    theme,
    highlight,
  );

  if (requestId === renderRequestId) {
    renderedLines.value = highlightedLines;
  }
};

onServerPrefetch(() => renderHighlight());

watch(
  [normalizedCode, () => props.language, () => props.highlight, resolvedTheme],
  ([code, language, highlight, theme]) =>
    renderHighlight(code, language, highlight, theme),
  { immediate: true },
);

const normalizeThemeValue = (value: string | null) =>
  value === "dark" ? "dark" : "light";

const findClosestThemeValue = (
  element: HTMLElement | null,
  attributeName: "data-theme" | "data-vf-theme",
) => {
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
  if (props.theme !== "inherit") {
    return;
  }

  inheritedTheme.value =
    findClosestThemeValue(rootElement.value, "data-theme") ??
    findClosestThemeValue(rootElement.value, "data-vf-theme") ??
    "light";
};

onMounted(() => {
  syncInheritedTheme();

  if (typeof MutationObserver === "undefined" || !rootElement.value) {
    return;
  }

  themeObserver = new MutationObserver(() => {
    syncInheritedTheme();
  });

  themeObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-theme", "data-vf-theme"],
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
.vcb {
  --vcb-margin-block: 1rem;
  --vcb-margin-block-start: var(--vcb-margin-block);
  --vcb-margin-block-end: var(--vcb-margin-block);
  --vcb-gap: 0;
  --vcb-border-color: color-mix(in srgb, rgb(15 23 42 / 12%) 92%, #cbd5e1);
  --vcb-border-radius: 0.625rem;
  --vcb-background-color: #fff;
  --vcb-text-color: #1f232b;
  --vcb-font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  --vcb-font-size: 0.8125rem;
  --vcb-line-height: 1.5;
  --vcb-header-gap: 0.75rem;
  --vcb-header-padding: var(--vcb-padding);
  --vcb-header-border-color: color-mix(
    in srgb,
    rgb(15 23 42 / 12%) 78%,
    transparent
  );
  --vcb-header-background-color: var(--vcb-background-color);
  --vcb-header-opacity: 0.9;
  --vcb-meta-gap: 0.55rem;
  --vcb-meta-color: #616773;
  --vcb-meta-font-size: 0.75rem;
  --vcb-filename-color: #1f232b;
  --vcb-filename-font-weight: 600;
  --vcb-actions-gap: 0.45rem;
  --vcb-action-border-color: color-mix(
    in srgb,
    rgb(15 23 42 / 12%) 80%,
    transparent
  );
  --vcb-action-border-radius: 0.375rem;
  --vcb-action-background-color: #fff;
  --vcb-action-text-color: #1f232b;
  --vcb-action-font-size: 0.75rem;
  --vcb-action-padding: 0.3rem 0.65rem;
  --vcb-action-font-weight: 400;
  --vcb-action-opacity: 0.88;
  --vcb-copy-color: var(--vcb-line-number-color);
  --vcb-copy-hover-color: var(--vcb-action-text-color);
  --vcb-copy-offset: 0.75rem;
  --vcb-copy-z-index: 1;
  --vcb-copy-line-height: 1.15;
  --vcb-copy-icon-size: 1rem;
  --vcb-copy-hidden-opacity: 0;
  --vcb-copy-visible-opacity: 1;
  --vcb-copy-transition-duration: 0.2s;
  --vcb-copy-color-transition-duration: 0.18s;
  --vcb-copy-transition-easing: ease;
  --vcb-padding: 0.75rem 0.9rem;
  --vcb-max-height: min(60vh, 40rem);
  --vcb-code-background-color: transparent;
  --vcb-line-gap: 0.7rem;
  --vcb-line-number-color: #616773;
  --vcb-line-number-min-width: 1ch;
  --vcb-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  --vcb-disabled-opacity: 0.6;

  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  margin-block: var(--vcb-margin-block-start) var(--vcb-margin-block-end);
  gap: var(--vcb-gap);
  border: 1px solid var(--vcb-border-color);
  border-radius: var(--vcb-border-radius);
  background: var(--vcb-background-color);
  color: var(--vcb-text-color);
  font-family: var(--vcb-font-family);
  font-size: var(--vcb-font-size);
  line-height: var(--vcb-line-height);
  overflow: hidden;
}

.vcb:first-child {
  margin-block-start: 0;
}

.vcb:last-child {
  margin-block-end: 0;
}

.vcb__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--vcb-header-gap);
  min-height: 0;
  padding: var(--vcb-header-padding);
  border-bottom: 1px solid var(--vcb-header-border-color);
  background: var(--vcb-header-background-color);
  opacity: var(--vcb-header-opacity);
}

.vcb__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--vcb-meta-gap);
  color: var(--vcb-meta-color);
  font-size: var(--vcb-meta-font-size);
  letter-spacing: 0;
}

.vcb__filename {
  color: var(--vcb-filename-color);
  font-weight: var(--vcb-filename-font-weight);
}

.vcb__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--vcb-actions-gap);
}

.vcb__copy {
  all: unset;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content !important;
  height: auto !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: max-content !important;
  line-height: var(--vcb-copy-line-height);
  position: absolute;
  top: var(--vcb-copy-offset);
  right: var(--vcb-copy-offset);
  z-index: var(--vcb-copy-z-index);
  border: 1px solid var(--vcb-action-border-color);
  border-radius: var(--vcb-action-border-radius);
  background: var(--vcb-action-background-color);
  color: var(--vcb-copy-color);
  padding: var(--vcb-action-padding) !important;
  font-size: var(--vcb-action-font-size);
  font-weight: var(--vcb-action-font-weight);
  opacity: var(--vcb-copy-hidden-opacity);
  pointer-events: none;
  transition:
    opacity var(--vcb-copy-transition-duration) var(--vcb-copy-transition-easing),
    color var(--vcb-copy-color-transition-duration)
      var(--vcb-copy-transition-easing);
  white-space: nowrap;
}

.vcb__copy:disabled {
  cursor: default;
}

.vcb__copy-icon {
  display: block;
  width: var(--vcb-copy-icon-size);
  height: var(--vcb-copy-icon-size);
}

.vcb__code-shell {
  position: relative;
}

.vcb .vcb__pre {
  margin: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
  padding: var(--vcb-padding);
  background: var(--vcb-code-background-color);
  max-height: var(--vcb-max-height);
  overflow: auto;
  white-space: pre;
}

.vcb__copy:hover,
.vcb .vcb__copy:focus-visible {
  color: var(--vcb-copy-hover-color);
}

.vcb .vcb__code-shell:hover .vcb__copy,
.vcb .vcb__code-shell:focus-within .vcb__copy {
  opacity: var(--vcb-copy-visible-opacity);
  pointer-events: auto;
}

.vcb__pre--wrap {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.vcb__line {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--vcb-line-gap);
}

.vcb__line-number {
  width: var(--vcb-line-number-width, var(--vcb-line-number-min-width));
  text-align: right;
  color: var(--vcb-line-number-color);
  min-width: var(--vcb-line-number-min-width);
  font-variant-numeric: tabular-nums;
  user-select: none;
  white-space: nowrap;
}

.vcb__line-content {
  min-width: 0;
  white-space: inherit;
}

/* stylelint-disable no-descending-specificity -- Theme selectors intentionally layer explicit, inherited, and fallback modes. */
.vcb[data-theme="light"],
:root:not([data-theme="dark"]) .vcb:not([data-theme="dark"]),
[data-theme="light"] .vcb,
[data-vf-theme="light"] .vcb,
:root:not([data-vf-theme="dark"]) .vcb:not([data-theme="dark"]) {
  box-shadow: var(--vcb-shadow);
}

.vcb[data-theme="dark"],
:root[data-theme="dark"] .vcb:not([data-theme="light"]),
[data-theme="dark"] .vcb:not([data-theme="light"]) {
  --vcb-background-color: var(--vcb-dark-background-color, #1e1e1e);
  --vcb-text-color: var(--vcb-dark-text-color, #d4d4d4);
  --vcb-border-color: var(
    --vcb-dark-border-color,
    color-mix(in srgb, #3c3c3c 88%, black)
  );
  --vcb-header-border-color: var(
    --vcb-dark-header-border-color,
    color-mix(in srgb, #3c3c3c 72%, transparent)
  );
  --vcb-header-background-color: var(--vcb-dark-header-background-color, transparent);
  --vcb-meta-color: var(--vcb-dark-meta-color, #9da0a6);
  --vcb-filename-color: var(--vcb-dark-filename-color, #d4d4d4);
  --vcb-action-border-color: var(
    --vcb-dark-action-border-color,
    color-mix(in srgb, #3c3c3c 76%, transparent)
  );
  --vcb-action-background-color: var(
    --vcb-dark-action-background-color,
    color-mix(in srgb, #252526 72%, transparent)
  );
  --vcb-action-text-color: var(--vcb-dark-action-text-color, #d4d4d4);
  --vcb-line-number-color: var(--vcb-dark-line-number-color, #9da0a6);
}
/* stylelint-enable no-descending-specificity */

.vcb--disabled {
  opacity: var(--vcb-disabled-opacity);
}
</style>
