# Changelog

## 1.2.1

### Fixed

- Improved runtime theme synchronization in legacy `sandbox` mode: iframe preview now reacts to `theme` prop changes and host theme inheritance updates (`data-theme`, `data-vf-theme`, root classes, and color-scheme fallbacks) without requiring custom parent-window scripts in demo payloads.
- Added sandbox theme-sync regression coverage (theme prop switches, `inherit` host mutations, and iframe-applied theme assertions).

## 1.2.0

### Added

- Added first-class `component` mode to `VfPlayground` with direct Vue component rendering in Preview (no `iframe/srcdoc`, no sandbox session).
- Added new props for component demos: `mode`, `component`, `componentPadding`, and `componentMinHeight`.
- Added optional `componentSource` and `componentSourceLanguage` for rendering source code in the `Code` tab while keeping component-mode preview rendering.
- Added optional `componentFiles` and `componentEntry` for multi-file read-only code tabs in `component` mode.
- Added discriminated union typings for `VfPlaygroundProps` to provide compile-time separation between sandbox and component modes.
- Added unit tests for sandbox regression and component mode behavior.

## 1.1.0

### Added

- Added `resolveImport` prop passthrough to `createPlaygroundSession` for host-controlled dependency resolution.
- Added `bootstrapScript` prop passthrough to inject host bootstrap logic into browser runtime sessions.
- Added session reinitialization on `framework`, `resolveImport`, and `bootstrapScript` changes to keep runtime behavior in sync.
- Expanded local type shims for updated playground-core runtime types and structured error payloads.

## 1.0.2

### Fixed

- Removed raw `:deep(...)` selectors from published CSS so consumer builds with Vite + `lightningcss` no longer emit `'deep' is not recognized as a valid pseudo-class` warnings.

## 1.0.1

### Fixed

- Fixed broken CSS subpath export: `@codemonster-ru/vueforge-playground/style.css` now resolves to the published `dist/index.css`.

## 1.0.0

### Changed

- First stable release of `@codemonster-ru/vueforge-playground`.
- Public component/plugin API is now treated as stable for `1.x`.

## 0.2.0

### Changed

- Simplified plugin entrypoint by inlining `VfPlaygroundPlugin` registration in `index.ts`.
- Renamed public API to the `Vf` namespace: `VuePlayground` -> `VfPlayground`, `VuePlaygroundPlugin` -> `VfPlaygroundPlugin`, `VuePlaygroundProps` -> `VfPlaygroundProps`.
- Removed theme runtime API exports from the public package surface (`setVuePlaygroundTheme`, default token maps, and theme option types).
- Added direct integration dependency on `@codemonster-ru/vueforge-core` for shared token/foundation styling alignment.
- Renamed playground CSS namespace from `cm-*` / `--cm-pg-*` to `vf-playground-*` / `--vf-playground-*` for ecosystem-wide prefix consistency.
- Updated README and demo integration surface to reflect the new minimal plugin API.

## 0.1.0

### Added

- Initial release of `@codemonster-ru/vueforge-playground`.
- Vue 3 playground adapter package with preview/code/console UI integration.
