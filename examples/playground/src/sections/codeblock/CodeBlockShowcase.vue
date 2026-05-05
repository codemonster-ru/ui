<script setup lang="ts">
import { useTheme } from "@codemonster-ru/vueforge-core";
import { VfContainer, VfSection } from "@codemonster-ru/vueforge-layouts";
import { VfCodeBlock } from "@codemonster-ru/vueforge-codeblock";

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

const blocks = [
  {
    language: "ts",
    filename: "long-1000-lines.ts",
    code: longTsSnippet,
    maxHeight: "var(--vf-breakpoint-xs)",
  },
  { language: "plaintext", filename: "plain.txt", code: snippets.plain },
  { language: "text", filename: "note.text", code: snippets.plain },
  { language: "txt", filename: "readme.txt", code: snippets.plain },
  { language: "js", filename: "demo.js", code: snippets.js },
  { language: "javascript", filename: "demo.javascript", code: snippets.js },
  { language: "ts", filename: "demo.ts", code: snippets.ts },
  { language: "typescript", filename: "demo.typescript", code: snippets.ts },
  { language: "vue", filename: "Demo.vue", code: snippets.vue },
  { language: "html", filename: "index.html", code: snippets.html },
  { language: "json", filename: "package.json", code: snippets.json },
  { language: "bash", filename: "script.bash", code: snippets.bash },
  { language: "shell", filename: "script.shell", code: snippets.bash },
  { language: "sh", filename: "script.sh", code: snippets.bash },
  { language: "css", filename: "demo.css", code: snippets.css },
  { language: "scss", filename: "demo.scss", code: snippets.scss },
  { language: "sass", filename: "demo.sass", code: snippets.sass },
];
</script>

<template>
  <VfContainer
    as="main"
    class="demo-page"
    size="2xl"
    :data-theme="resolvedTheme"
  >
    <section class="demo-block">
      <div class="demo-block__header">
        <h2>VfCodeBlock</h2>
      </div>

      <VfSection class="demo-surface" surface>
        <div class="demo-grid">
          <VfCodeBlock
            v-for="block in blocks"
            :key="block.filename"
            :language="block.language"
            :filename="block.filename"
            :code="block.code"
            :max-height="block.maxHeight"
            :theme="resolvedTheme"
            show-line-numbers
          />
        </div>
      </VfSection>
    </section>
  </VfContainer>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: var(--vf-color-bg);
}

.demo-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
}

.demo-grid :deep(.vf-codeblock) {
  --vf-codeblock-margin-block-start: 0;
  --vf-codeblock-margin-block-end: 0;
}

.demo-surface {
  min-width: 0;
}
</style>
