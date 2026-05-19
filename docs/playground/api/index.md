---
title: "API"
description: "Public API reference for the playground package"
slug: "/vueforge/playground/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-playground`.

## Component and Plugin

- `VfPlayground`: UI component for sandbox/component demo modes.
- `VfPlaygroundPlugin`: Vue plugin that registers `VfPlayground`.
- `VfPlaygroundPluginOptions`
  - `componentName?`: custom global component name.

## Props Model

- Shared props (`VfPlaygroundSharedProps`)
  - `height`, `theme`, `initialTab`, custom renderers (`tabsRenderer`, `actionsRenderer`, `filesRenderer`).
- Sandbox mode (`VfPlaygroundSandboxProps`)
  - `mode?: 'sandbox'`, `files`, `entry`, `framework`, `autorun`, `showCode`, `resolveImport`, `bootstrapScript`.
- Component mode (`VfPlaygroundComponentProps`)
  - `mode: 'component'`, `component`, `componentSource`, `componentSourceLanguage`, `componentFiles`, `componentEntry`, `componentPadding`, `componentMinHeight`.
- Union type: `VfPlaygroundProps`.

## CSS Exports

- `@codemonster-ru/vueforge-playground/style.css`
