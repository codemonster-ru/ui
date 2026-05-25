---
title: "API"
description: "Public API reference for the playground package"
order: 3
---

# API

This section provides a quick overview before the detailed subsections below.


## Overview

Public API surface of `@codemonster-ru/vueforge-playground`.

## Component and Plugin

The following items are listed in this section:

- `VfPlayground`: UI component for sandbox/component demo modes.
- `VfPlaygroundPlugin`: Vue plugin that registers `VfPlayground`.
- `VfPlaygroundPluginOptions`: plugin options contract.
- `componentName?`: custom global component name.

## Props Model

The following items are listed in this section:

- Shared props (`VfPlaygroundSharedProps`): `height`, `theme`, `initialTab`, `tabsRenderer`, `actionsRenderer`, `filesRenderer`.
- Sandbox mode (`VfPlaygroundSandboxProps`): `mode?: 'sandbox'`, `files`, `entry`, `framework`, `autorun`, `showCode`, `resolveImport`, `bootstrapScript`.
- Component mode (`VfPlaygroundComponentProps`): `mode: 'component'`, `component`, `componentSource`, `componentSourceLanguage`, `componentFiles`, `componentEntry`, `componentPadding`, `componentMinHeight`.
- Union type: `VfPlaygroundProps`.

## CSS Exports

The following items are listed in this section:

- `@codemonster-ru/vueforge-playground/style.css`
