# Changelog

All notable changes to this project will be documented in this file.

## 1.3.0

### Added

- Added `controlLineHeight` to the public `VfThemeTokens` contract for single-line control geometry.

## 1.2.4

### Added

- Added canonical `vfBreakpoints` export (`xs` through `2xl`) and related breakpoint types from the public `@codemonster-ru/vueforge-theme` API.

### Changed

- Moved breakpoint source from JSON to a TypeScript constant for stable ESM consumption across workspace package builds.

## 1.2.3

### Changed

- republished release from the current monorepo pipeline after previous `1.2.2` tag had already been published on npm

## 1.2.2

### Changed

- expanded serialization regression tests to cover both `breakpoint2xl` and `fontSize2xl` across `themeTokensToCssVars`, `themePresetToCssText`, and `applyThemeConfig`, including negative checks for legacy non-kebab keys

## 1.2.1

### Fixed

- corrected CSS variable serialization for tokens containing digit suffixes: `breakpoint2xl` now becomes `--vf-breakpoint-2xl` (instead of `--vf-breakpoint2xl`)

### Changed

- extended runtime tests to cover positive and negative serialization checks for digit-boundary token names in `themeTokensToCssVars`, `themePresetToCssText`, and `applyThemeConfig`

## 1.2.0

### Changed

- clarified the package boundary in the README and documented that this package stays engine-only without a built-in `defaultThemePreset`

### Removed

- removed `textLineHeight`, `headingLineHeight`, and `tabsLineHeight` from the exported `VfThemeTokens` contract

## 1.1.0

### Added

- `themeConfigsToCssText(...)` for serializing multiple resolved theme configs into one CSS payload
- `applyThemeConfigs(...)` for applying multiple resolved theme configs generically, grouped by `styleId`
- strict TypeScript typechecking for test files via `tsconfig.test.json`

### Changed

- `applyThemeConfig(...)` now uses the shared multi-config apply path internally while keeping the same external API
- test helpers now centralize partial token casting for compact fixture presets

## 1.0.0

### Added

- initial release of `@codemonster-ru/vueforge-theme`
- theme token types and preset types
- theme preset resolution and CSS variable helpers
- light, dark, and system mode helpers
- shared motion tokens
