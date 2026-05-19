---
title: "API"
description: "Public API reference for the codeblock package"
slug: "/vueforge/codeblock/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-codeblock`.

## Plugin and Component

- `default` (`Plugin`): registers `VfCodeBlock`.
- `VfCodeBlock`: standalone component.

```ts
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock';
app.use(VueForgeCodeBlock, {
  themeScope: '#docs-root'
});
```

## Highlight Helpers

- `escapeCodeHtml(code: string): string`
- `highlightCodeLine(code: string, language?: string): Promise<string>`
- `highlightCodeBlock(code: string, language?: string): Promise<string>`

## Runtime Theme Helper

```ts
setCodeBlockThemeVars(themeVars, options?)
```

Injects CSS variables into a runtime `<style>` element.

Options:

- `themeVars`: `{ base?, light?, dark? }`
- `options.themeScope`: target selector (`:root` by default)
- `options.styleNonce`: CSP nonce for generated style tag

## Component Contract (`VfCodeBlock`)

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

- `SUPPORTED_CODE_BLOCK_LANGUAGES`: built-in aliases (`ts`, `vue`, `json`, `bash`, etc.).

## Types

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

- `@codemonster-ru/vueforge-codeblock/style.css`
