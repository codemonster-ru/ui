# Changelog

## 1.1.0

### Added

- Added Vue-focused browser runtime improvements for multi-file playground entries with explicit import resolution support.
- Added optional `resolveImport` hook in `CreatePlaygroundSessionOptions` for host-controlled module/style resolution.
- Added optional `bootstrapScript` injection point for host-side setup without external bridge files.
- Added structured import resolution error metadata (`specifier`, `fromFile`, `reason`) in runtime errors.
- Added browser runtime coverage tests for CSS imports, bare imports, custom resolver behavior, and unresolved import diagnostics.

## 1.0.0

### Changed

- First stable release of `@codemonster-ru/vueforge-playground-core`.
- Public runtime API is now treated as stable for `1.x`.

## 0.1.0

### Added

- Initial release of `@codemonster-ru/vueforge-playground-core`.
- Framework-agnostic playground runtime primitives.
