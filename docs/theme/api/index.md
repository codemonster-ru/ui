---
title: "API"
description: "Public API reference for the theme package"
slug: "/vueforge/theme/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-theme`.

## Constants

- `DEFAULT_ATTRIBUTE`: default attribute for applied theme mode.
- `DEFAULT_STORAGE_KEY`: default storage key for persisted mode.

## Mode Utilities

- `isThemeMode(value)`: type guard for `'light' | 'dark' | 'system'`.
- `resolveTheme(mode, systemTheme): 'light' | 'dark'`: resolves `'system'` to concrete mode.

## Runtime and Preset Utilities

- `createThemePreset(config): VfThemePreset`
- `resolveThemePreset(preset): VfResolvedThemePreset`
- `resolveThemeConfig(config): VfResolvedThemeConfig`
- `resolveThemePresetOptions(options): VfResolvedThemePresetOptions`
- `applyThemeConfig(config): void`
- `applyThemeConfigs(configs): void`
- `themePresetToCssText(preset): string`
- `themeConfigsToCssText(configs): string`
- `themeTokensToCssVars(tokens, options?): string`

## Usage Example

```ts
import { applyThemeConfig } from '@codemonster-ru/vueforge-theme';

applyThemeConfig({
  light: { colorPrimary: '#2563eb' },
  dark: { colorPrimary: '#60a5fa' }
});
```

## Motion Tokens

- `vfMotionTokens`
- `vfMotionDurationsMs`

## Types

- `VfResolvedTheme`
- `VfResolvedThemeConfig`
- `VfResolvedThemePreset`
- `VfResolvedThemePresetOptions`
- `VfThemeConfig`
- `VfThemeMode`
- `VfThemePreset`
- `VfThemePresetOptions`
- `VfThemeTokens`
