<script setup lang="ts">
import { VfThemeSwitch, useTheme } from "@codemonster-ru/vueforge-core";
import { CodeBlock } from "@codemonster-ru/vueforge-codeblock";

const { resolvedTheme } = useTheme();
const longSnippetLineCount = 1000;
const longTsSnippet = Array.from({ length: longSnippetLineCount }, (_, index) => {
  const line = index + 1;

  return `const row${line.toString().padStart(4, "0")} = { id: ${line}, title: "Item ${line}" };`;
}).join("\n");

const snippets = {
  plain: [
    "Plain text sample",
    "Path: src/components/CodeBlock.vue",
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
    maxHeight: "420px",
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
  <main class="demo-page" :data-theme="resolvedTheme">
    <div class="demo-toolbar">
      <VfThemeSwitch variant="button" />
    </div>

    <div class="demo-surface">
      <div class="demo-grid">
        <CodeBlock
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
    </div>
  </main>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  padding: 16px;
  background: var(--vf-color-bg, #f6f8fb);
}

.demo-toolbar {
  width: min(100%, 1320px);
  margin: 0 auto 12px;
  display: flex;
  justify-content: flex-end;
}

.demo-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
}

.demo-grid :deep(.vcb) {
  --vcb-margin-block-start: 0;
  --vcb-margin-block-end: 0;
}

.demo-surface {
  width: min(100%, 1320px);
  margin: 0 auto;
  padding: 14px;
  border: 1px solid var(--vf-color-border, rgb(15 23 42 / 12%));
  border-radius: 14px;
  background: color-mix(
    in srgb,
    var(--vf-color-surface, #fff) 90%,
    var(--vf-color-bg, #f6f8fb)
  );
}
</style>
