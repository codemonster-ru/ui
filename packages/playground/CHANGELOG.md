# Changelog

## 2.2.0

### Added

- Added explicit CSS exports for point usage: `@codemonster-ru/vueforge-playground/playground.css` and `@codemonster-ru/vueforge-playground/critical.css`.
- Added smoke coverage to verify CSS export paths resolve in published package artifacts.

### Changed

- Updated package export surface for per-entry usage so consumers can load only required styles.

## 2.1.0

### Added

- Added shared `minHeight` prop to `VfPlayground` container props (`number | string`) to support minimum-height layouts without forcing fixed height.
- Added regression coverage for simultaneous `minHeight` and `height` style application on the playground root container.

## 2.0.0

### Changed

- Added explicit subpath exports: `@codemonster-ru/vueforge-playground/ui` and `@codemonster-ru/vueforge-playground/runtime`.
- Removed root import `@codemonster-ru/vueforge-playground`; use `@codemonster-ru/vueforge-playground/ui` for component/plugin API.

## 1.4.0

### Added

- Added `heightMode` prop to `VfPlayground` with `fixed` (default), `auto-preview`, and `auto` options.
- Added auto-height layout behavior for preview panels, including tab-aware `auto-preview` mode.

## 1.3.2

### Fixed

- Updated component-mode preview default padding in `VfPlayground` to use `--vf-surface-padding` instead of `0`, improving visual consistency with surrounding surface layout.

## 1.3.1

### Fixed

- Lazy-load the sandbox runtime from `VfPlayground` so component-mode consumers no longer pull the TypeScript compiler into their initial bundle.
- Kept sandbox execution behavior intact while preventing duplicate session creation during async runtime initialization.

## 1.3.0

### Added

- Added `initialTab` to `VfPlayground` so demos can choose the default `code`, `preview`, or `console` tab while keeping tab state uncontrolled.
- Added fallback handling for unavailable initial tabs, including hidden code tabs and component-mode console.

## 1.2.3

### Fixed

- Synced embedded code-tab `VfCodeBlock` header/meta typography with the updated package default (`0.875rem`), so playground code panels match standalone `VfCodeBlock` sizing.
- Updated dependency ranges to consume the latest `@codemonster-ru/vueforge-core` and `@codemonster-ru/vueforge-codeblock` patch releases.

## 1.2.2

### Fixed

- Unified `VfPlayground` code-tab `VfCodeBlock` embedding to avoid double borders/inner rounding artifacts by applying embed-only border/radius/shadow overrides.
- Aligned code-tab header height with playground tabs for consistent toolbar rhythm.
- Added regression coverage to keep playground codeblock overrides constrained to embed-safe/layout-focused behavior.

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
