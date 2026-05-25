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

## Plugin and Component

The following items are listed in this section:

- `default` (`Plugin`): registers `VfCodeBlock`.
- `VfCodeBlock`: standalone component.

```ts
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock';
app.use(VueForgeCodeBlock, {
  themeScope: '#docs-root'
});
```

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
