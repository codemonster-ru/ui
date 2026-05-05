# Changelog

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
