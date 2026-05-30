---
title: "API"
description: "Public API reference for the playground package"
order: 3
---

# API

This section provides a quick overview before the detailed subsections below.


## Overview

Public API surface of `@codemonster-ru/vueforge-playground`.

Subpath exports:

- `@codemonster-ru/vueforge-playground/ui` (UI component/plugin surface)
- `@codemonster-ru/vueforge-playground/runtime` (runtime session factory and runtime types)
- `@codemonster-ru/vueforge-playground/style.css`
- `@codemonster-ru/vueforge-playground/playground.css`
- `@codemonster-ru/vueforge-playground/critical.css`

Migration note:

- Root entrypoint `@codemonster-ru/vueforge-playground` removed.
- Use `@codemonster-ru/vueforge-playground/ui` for component/plugin API.
- Use `@codemonster-ru/vueforge-playground/runtime` for runtime API.

## Component and Plugin

The following items are listed in this section:

- `VfPlayground`: UI component for sandbox/component demo modes.
- `VfPlaygroundAsync`: async wrapper with built-in skeleton fallback while the playground chunk is loading.
- `VfPlaygroundPlugin`: Vue plugin that registers `VfPlayground`.
- `VfPlaygroundPluginOptions`: plugin options contract.
- `componentName?`: custom global component name.

## Props Model

The following items are listed in this section:

- Shared props (`VfPlaygroundSharedProps`): `minHeight`, `height`, `theme`, `initialTab`, `tabsRenderer`, `actionsRenderer`, `filesRenderer`.
- Sandbox mode (`VfPlaygroundSandboxProps`): `mode?: 'sandbox'`, `files`, `entry`, `framework`, `autorun`, `showCode`, `resolveImport`, `bootstrapScript`.
- Component mode (`VfPlaygroundComponentProps`): `mode: 'component'`, `component`, `componentSource`, `componentSourceLanguage`, `componentFiles`, `componentEntry`, `componentPadding`, `componentMinHeight`.
- Union type: `VfPlaygroundProps`.

## CSS Exports

The following items are listed in this section:

- `@codemonster-ru/vueforge-playground/style.css`
- `@codemonster-ru/vueforge-playground/playground.css`
- `@codemonster-ru/vueforge-playground/critical.css`

Notes:

- `@codemonster-ru/vueforge-playground/ui` auto-imports UI CSS.
- `@codemonster-ru/vueforge-playground/runtime` does not import UI CSS.
