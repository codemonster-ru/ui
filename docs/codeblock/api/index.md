---
title: "API"
description: "Public API reference for the codeblock package"
order: 3
---

# API

Reference for package-level exports and runtime helpers available in `@codemonster-ru/vueforge-codeblock`.

## Overview

Public API surface of `@codemonster-ru/vueforge-codeblock`.

This page documents the package-level API (plugin entry, exports, helpers, and types), not only the `VfCodeBlock` component tab API.

Subpath exports:

- `@codemonster-ru/vueforge-codeblock/view` (component/plugin-oriented entry)
- `@codemonster-ru/vueforge-codeblock/highlight` (highlight helpers)
- `@codemonster-ru/vueforge-codeblock/style.css`
- `@codemonster-ru/vueforge-codeblock/codeblock.css`
- `@codemonster-ru/vueforge-codeblock/critical.css`

Migration note:

- Root entrypoint `@codemonster-ru/vueforge-codeblock` removed.
- Use `@codemonster-ru/vueforge-codeblock/view` for plugin/component API.
- Use `@codemonster-ru/vueforge-codeblock/highlight` for highlight helpers.

## Plugin and Component

The following items are listed in this section:

- `default` (`Plugin`): registers `VfCodeBlock`.
- `VfCodeBlock`: standalone component.

```ts
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock/view';
app.use(VueForgeCodeBlock, {
  themeScope: '#docs-root',
  allowedLanguages: ['ts', 'vue', 'json'],
  preloadLanguages: ['ts', 'vue']
});
```

Language options:

- `allowedLanguages?: string[]`: global runtime allowlist.
- `preloadLanguages?: string[]`: preloads selected languages on plugin install (non-blocking, respects allowlist).

## Highlight Helpers

The following items are listed in this section:

- `escapeCodeHtml(code: string): string`
- `highlightCodeLine(code: string, language?: string): Promise<string>`
- `highlightCodeBlock(code: string, language?: string): Promise<string>`

## Runtime Theme Helper

The code snippet below illustrates this section.

```ts
setCodeBlockThemeVars(themeVars, options?)
```

Injects CSS variables into a runtime `<style>` element.

Options:

- `themeVars`: `{ base?, light?, dark? }`
- `options.themeScope`: target selector (`:root` by default)
- `options.styleNonce`: CSP nonce for generated style tag

## Component Contract (`VfCodeBlock`)

The following items are listed in this section:

- `code?: string`
- `language?: CodeBlockLanguage`
- `allowedLanguages?: string[]`
- `languageFallback?: 'plaintext' | 'text'`
- `filename?: string`
- `showHeader?: boolean`
- `showLineNumbers?: boolean`
- `copyable?: boolean`
- `copyLabel?: string`
- `copiedLabel?: string`
- `copiedDuration?: number`
- `theme?: 'inherit' | 'light' | 'dark'`
- `wrap?: boolean`
- `highlight?: boolean`
- `containerMinHeight?: string`
- `minHeight?: string`
- `maxHeight?: string`
- `disabled?: boolean`

## Constants

The following items are listed in this section:

- `SUPPORTED_CODE_BLOCK_LANGUAGES`: built-in aliases (`ts`, `vue`, `json`, `bash`, etc.).

## Types

The following items are listed in this section:

- `CodeBlockCopyPayload`
- `CodeBlockCssVarMap`
- `CodeBlockCssVarValue`
- `CodeBlockLanguage`
- `CodeBlockPluginOptions`
- `CodeBlockProps`
- `CodeBlockTheme`
- `CodeBlockThemeVarOptions`
- `SupportedCodeBlockLanguage`

## CSS Export

The following items are listed in this section:

- `@codemonster-ru/vueforge-codeblock/style.css`
- `@codemonster-ru/vueforge-codeblock/codeblock.css`
- `@codemonster-ru/vueforge-codeblock/critical.css`

Notes:

- `@codemonster-ru/vueforge-codeblock/view` auto-imports component CSS.
- `@codemonster-ru/vueforge-codeblock/highlight` does not import UI CSS.
