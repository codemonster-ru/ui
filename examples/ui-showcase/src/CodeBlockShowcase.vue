<script setup lang="ts">
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import { CmButton, CmSkeleton } from '@codemonster-ru/ui-vue';
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ theme: 'light' | 'dark' }>();

const longSnippetLineCount = 1000;
const longTsSnippet = Array.from({ length: longSnippetLineCount }, (_, index) => {
  const line = index + 1;

  return `const row${line.toString().padStart(4, '0')} = { id: ${line}, title: "Item ${line}" };`;
}).join('\n');

const snippets = {
  plain: ['Plain text sample', 'Path: src/components/VfCodeBlock.vue', 'URL: https://example.test/docs'].join('\n'),
  js: ["const greet = (name = 'world') => `Hello, ${name}`;", "console.log(greet('Vue'));"].join('\n'),
  ts: ['type User = { id: number; name: string };', "const user: User = { id: 1, name: 'Ada' };"].join('\n'),
  vue: [
    '<script setup lang="ts">',
    "const label = 'Save';",
    '</scr' + 'ipt>',
    '',
    '<template>',
    '  <button>{{ label }}</button>',
    '</template>',
  ].join('\n'),
  html: ['<!doctype html>', '<html>', '  <body><h1>Hello</h1></body>', '</html>'].join('\n'),
  json: ['{', '  "name": "@codemonster-ru/vueforge-codeblock"', '}'].join('\n'),
  dotenv: [
    '# Application environment',
    'APP_ENV=production',
    'APP_DEBUG=false',
    'DATABASE_URL="postgres://localhost/vueforge"',
  ].join('\n'),
  php: ['<?php', '', 'final readonly class User', '{', '    public function __construct(public int $id) {}', '}'].join(
    '\n',
  ),
  cron: [
    '# Run the scheduler every five minutes',
    '*/5 * * * * php artisan schedule:run',
    '0 2 * * * npm run backup',
  ].join('\n'),
  bash: ['#!/usr/bin/env bash', 'npm install', 'npm run build'].join('\n'),
  css: ['.card {', '  border: 1px solid #d9dde3;', '}'].join('\n'),
  scss: ['$brand: #0e639c;', '.btn { color: $brand; }'].join('\n'),
  sass: ['$brand: #0e639c', '.btn', '  color: $brand'].join('\n'),
};

const estimateSkeletonMinHeight = (code: string, hasMaxHeight: boolean): number => {
  if (hasMaxHeight) {
    return 420;
  }

  const lineCount = code.split('\n').length;
  const visibleLines = Math.min(lineCount, 12);
  const estimated = 112 + visibleLines * 28;

  return Math.max(180, estimated);
};

const blocks = [
  {
    language: 'ts',
    filename: 'long-1000-lines.ts',
    code: longTsSnippet,
    maxHeight: 'var(--cm-breakpoint-xs)',
    skeletonMinHeight: estimateSkeletonMinHeight(longTsSnippet, true),
  },
  {
    language: 'plaintext',
    filename: 'plain.txt',
    code: snippets.plain,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false),
  },
  {
    language: 'text',
    filename: 'note.text',
    code: snippets.plain,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false),
  },
  {
    language: 'txt',
    filename: 'readme.txt',
    code: snippets.plain,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.plain, false),
  },
  {
    language: 'js',
    filename: 'demo.js',
    code: snippets.js,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.js, false),
  },
  {
    language: 'javascript',
    filename: 'demo.javascript',
    code: snippets.js,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.js, false),
  },
  {
    language: 'ts',
    filename: 'demo.ts',
    code: snippets.ts,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.ts, false),
  },
  {
    language: 'typescript',
    filename: 'demo.typescript',
    code: snippets.ts,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.ts, false),
  },
  {
    language: 'vue',
    filename: 'Demo.vue',
    code: snippets.vue,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.vue, false),
  },
  {
    language: 'html',
    filename: 'index.html',
    code: snippets.html,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.html, false),
  },
  {
    language: 'json',
    filename: 'package.json',
    code: snippets.json,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.json, false),
  },
  {
    language: 'dotenv',
    filename: '.env',
    code: snippets.dotenv,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.dotenv, false),
  },
  {
    language: 'php',
    filename: 'User.php',
    code: snippets.php,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.php, false),
  },
  {
    language: 'cron',
    filename: 'schedule.cron',
    code: snippets.cron,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.cron, false),
  },
  {
    language: 'bash',
    filename: 'script.bash',
    code: snippets.bash,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false),
  },
  {
    language: 'shell',
    filename: 'script.shell',
    code: snippets.bash,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false),
  },
  {
    language: 'sh',
    filename: 'script.sh',
    code: snippets.bash,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.bash, false),
  },
  {
    language: 'css',
    filename: 'demo.css',
    code: snippets.css,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.css, false),
  },
  {
    language: 'scss',
    filename: 'demo.scss',
    code: snippets.scss,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.scss, false),
  },
  {
    language: 'sass',
    filename: 'demo.sass',
    code: snippets.sass,
    skeletonMinHeight: estimateSkeletonMinHeight(snippets.sass, false),
  },
];

const ready = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function replay() {
  ready.value = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    ready.value = true;
  }, 2200);
}

onMounted(replay);
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <section class="showcase-group" aria-labelledby="codeblock-heading">
    <header>
      <h1 id="codeblock-heading">VfCodeBlock</h1>
      <p>
        Render syntax-highlighted, themed source code with filenames, line numbers, copy controls, and constrained
        long-file scrolling.
      </p>
      <CmButton type="button" variant="secondary" @click="replay">Replay skeleton</CmButton>
    </header>

    <div class="showcase-panel codeblock-grid" :aria-busy="!ready" :data-vf-theme="theme">
      <template v-for="block in blocks" :key="block.filename">
        <VfCodeBlock
          v-if="ready"
          :language="block.language"
          :filename="block.filename"
          :code="block.code"
          :max-height="block.maxHeight"
          :theme="theme"
          :container-min-height="`${block.skeletonMinHeight}px`"
          show-line-numbers
        />
        <CmSkeleton v-else :min-height="block.skeletonMinHeight" />
      </template>
    </div>
  </section>
</template>

<style scoped>
.codeblock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
  align-items: start;
  gap: var(--cm-space-4);
}

.codeblock-grid :deep(.vf-codeblock) {
  --vf-codeblock-margin-block-start: 0;
  --vf-codeblock-margin-block-end: 0;
}
</style>
