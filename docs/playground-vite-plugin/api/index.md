---
title: "API"
description: "Public API reference for the playground-vite-plugin package"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-playground-vite-plugin`.

## Main Function

```ts
vueforgePlaygroundVirtualPlugin(options: VueforgePlaygroundVirtualPluginOptions): Plugin
```

Creates a Vite plugin that resolves configured virtual ids into module exports from local source files.

## `VueforgePlaygroundVirtualPluginOptions`

- `entries`: map of virtual entry id to file config.
- `virtualPrefix?`: virtual module prefix (default: `virtual:vueforge-playground/`).
- `pluginName?`: custom Vite plugin name.
- `exportMode?`: default export strategy.

## Entry Model

- `VueforgePlaygroundVirtualEntryValue`
  - `string`: shortcut for `{ file: '<path>' }`
  - `VueforgePlaygroundVirtualEntryConfig`: `{ file, export? }`

- `VueforgePlaygroundVirtualExportMode`
  - `'default'`: emits `export { default } from '<file>'`
  - `'namespace'`: emits `export * from '<file>'`
  - `{ named: string }`: emits `export { <named> } from '<file>'`

## `entries` Example

```ts
entries: {
  'demo/button': './src/demos/ButtonDemo.vue',
  'demo/utils': {
    file: './src/demos/utils.ts',
    export: 'namespace'
  },
  'demo/theme': {
    file: './src/demos/theme.ts',
    export: { named: 'themeTokens' }
  }
}
```

## Resolution Notes

- Only configured ids are resolved.
- Plugin handles both plain and Vite-internal prefixed ids.
- File paths are resolved to absolute paths before emitting module code.

## Types

- `VueforgePlaygroundVirtualExportMode`
- `VueforgePlaygroundVirtualEntryConfig`
- `VueforgePlaygroundVirtualEntryValue`
- `VueforgePlaygroundVirtualPluginOptions`
