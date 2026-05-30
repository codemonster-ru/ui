<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useTheme } from "@codemonster-ru/vueforge-core";
import { VfSkeleton } from "@codemonster-ru/vueforge-core/skeleton";
import { VfSkeletonGate } from "@codemonster-ru/vueforge-core/skeleton-gate";
import { VfSection } from "@codemonster-ru/vueforge-layouts";
import { VfCodeBlock } from "@codemonster-ru/vueforge-codeblock/view";

const { resolvedTheme } = useTheme();
const longSnippetLineCount = 1000;
const longTsSnippet = Array.from({ length: longSnippetLineCount }, (_, index) => {
  const line = index + 1;

  return `const row${line.toString().padStart(4, "0")} = { id: ${line}, title: "Item ${line}" };`;
}).join("\n");

const snippets = {
  plain: [
    "Plain text sample",
    "Path: src/components/VfCodeBlock.vue",
    "URL: https://example.test/docs",
  ].join("\n"),
  js: [
    "const greet = (name = 'world') => `Hello, ${name}`;",
    "console.log(greet('Vue'));",
  ].join("\n"),
  ts: [
    "type User = { id: number; name: string };",
    "const user: User = { id: 1, name: 'Ada' };",
  ].join("\n"),
  vue: [
    '<script setup lang="ts">',
    "const label = 'Save';",
    "</scr" + "ipt>",
    "",
    "<template>",
    '  <button>{{ label }}</button>',
    "</template>",
  ].join("\n"),
  html: [
    "<!doctype html>",
    "<html>",
    "  <body><h1>Hello</h1></body>",
    "</html>",
  ].join("\n"),
  json: ['{', '  "name": "@codemonster-ru/vueforge-codeblock"', '}'].join("\n"),
  bash: ["#!/usr/bin/env bash", "npm install", "npm run build"].join("\n"),
  css: [".card {", "  border: 1px solid #d9dde3;", "}"].join("\n"),
  scss: ["$brand: #0e639c;", ".btn { color: $brand; }"] .join("\n"),
  sass: ["$brand: #0e639c", ".btn", "  color: $brand"].join("\n"),
};

const estimateSkeletonMinHeight = (code: string, hasMaxHeight: boolean): number => {
  if (hasMaxHeight) {
    return 420;
  }

  const lineCount = code.split("\n").length;
  const visibleLines = Math.min(lineCount, 12);
  const estimated = 112 + visibleLines * 28;

  return Math.max(180, estimated);
};

const blocks = [
  {
    language: "ts",
    filename: "long-1000-lines.ts",
    code: longTsSnippet,
    maxHeight: "var(--vf-breakpoint-xs)",
    skeletonMinHeight: estimateSkeletonMinHeight(longTsSnippet, true),
  },
  { language: "plaintext", filename: "plain.txt", code: snippets.plain, skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false) },
  { language: "text", filename: "note.text", code: snippets.plain, skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false) },
  { language: "txt", filename: "readme.txt", code: snippets.plain, skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false) },
  { language: "js", filename: "demo.js", code: snippets.js, skeletonMinHeight: estimateSkeletonMinHeight(snippets.js, false) },
  { language: "javascript", filename: "demo.javascript", code: snippets.js, skeletonMinHeight: estimateSkeletonMinHeight(snippets.js, false) },
  { language: "ts", filename: "demo.ts", code: snippets.ts, skeletonMinHeight: estimateSkeletonMinHeight(snippets.ts, false) },
  { language: "typescript", filename: "demo.typescript", code: snippets.ts, skeletonMinHeight: estimateSkeletonMinHeight(snippets.ts, false) },
  { language: "vue", filename: "Demo.vue", code: snippets.vue, skeletonMinHeight: estimateSkeletonMinHeight(snippets.vue, false) },
  { language: "html", filename: "index.html", code: snippets.html, skeletonMinHeight: estimateSkeletonMinHeight(snippets.html, false) },
  { language: "json", filename: "package.json", code: snippets.json, skeletonMinHeight: estimateSkeletonMinHeight(snippets.json, false) },
  { language: "bash", filename: "script.bash", code: snippets.bash, skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false) },
  { language: "shell", filename: "script.shell", code: snippets.bash, skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false) },
  { language: "sh", filename: "script.sh", code: snippets.bash, skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false) },
  { language: "css", filename: "demo.css", code: snippets.css, skeletonMinHeight: estimateSkeletonMinHeight(snippets.css, false) },
  { language: "scss", filename: "demo.scss", code: snippets.scss, skeletonMinHeight: estimateSkeletonMinHeight(snippets.scss, false) },
  { language: "sass", filename: "demo.sass", code: snippets.sass, skeletonMinHeight: estimateSkeletonMinHeight(snippets.sass, false) },
];

const CODEBLOCK_SKELETON_DELAY_MS = 2200;
const codeblockReady = ref(false);
let codeblockReadyTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleCodeblockReady = () => {
  if (codeblockReadyTimer) {
    clearTimeout(codeblockReadyTimer);
  }

  codeblockReadyTimer = setTimeout(() => {
    codeblockReady.value = true;
    codeblockReadyTimer = null;
  }, CODEBLOCK_SKELETON_DELAY_MS);
};

const replayCodeblockSkeleton = () => {
  codeblockReady.value = false;
  scheduleCodeblockReady();
};

onMounted(() => {
  scheduleCodeblockReady();
});

onBeforeUnmount(() => {
  if (codeblockReadyTimer) {
    clearTimeout(codeblockReadyTimer);
    codeblockReadyTimer = null;
  }
});
</script>

<template>
  <main class="demo-page" :data-theme="resolvedTheme">
    <div class="demo-container">
      <section class="demo-block">
        <div class="demo-block__header">
          <h2>VfCodeBlock</h2>
          <button class="demo-replay-button" type="button" @click="replayCodeblockSkeleton">Replay skeleton</button>
        </div>

        <VfSection class="demo-surface" surface>
          <div class="demo-grid">
            <VfSkeletonGate
              v-for="block in blocks"
              :key="`gate-${block.filename}`"
              :ready="codeblockReady"
              :min-height="block.skeletonMinHeight"
              :preserve-last-height="true"
              radius="var(--vf-layout-section-radius)"
            >
              <VfCodeBlock
                :language="block.language"
                :filename="block.filename"
                :code="block.code"
                :max-height="block.maxHeight"
                :theme="resolvedTheme"
                show-line-numbers
              />
              <template #skeleton>
                <VfSkeleton :min-height="block.skeletonMinHeight" radius="var(--vf-layout-section-radius)" />
              </template>
            </VfSkeletonGate>
          </div>
        </VfSection>
      </section>
    </div>
  </main>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: var(--vf-color-bg);
}

.demo-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
  align-items: start;
}

.demo-grid :deep(.vf-codeblock) {
  --vf-codeblock-margin-block-start: 0;
  --vf-codeblock-margin-block-end: 0;
}

.demo-surface {
  min-width: 0;
}

.demo-replay-button {
  justify-self: start;
  align-self: center;
  inline-size: auto;
  width: auto;
  min-width: max-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  background: var(--vf-color-surface);
  color: var(--vf-color-text);
  padding: 0.35rem 0.65rem;
  font: inherit;
  cursor: pointer;
}
</style>
