# Changelog

## 2.0.0

### Changed

- Made sandbox previews synchronize the canonical `data-vf-theme` attribute only.
- Simplified local import and re-export rewriting without changing the public session API.
- Made the package `exports` map authoritative for its ESM runtime and declarations.

### Removed

- Removed the sandbox `data-theme` compatibility mirror and legacy top-level resolver metadata.

### Breaking changes

- Custom preview integrations must read `data-vf-theme`, and package resolution must honor
  `exports`.

## 1.2.0

### Added

- Added deterministic circular-import diagnostics and stricter import resolution coverage.
- Added structural validation for console and runtime error messages received from the configured
  preview iframe.

### Changed

- Scoped theme transfer now accepts only validated VueForge variables and works with opaque-origin
  sandbox frames.
- Declared Node.js 18 support and included all build, lint, and test tooling needed by a clean package
  checkout.

### Fixed

- Rejected messages from unrelated windows and malformed runtime payloads.
- Prevented direct and indirect import cycles from recursing until a stack failure.

### Breaking changes

- None in the documented public API. Invalid transport payloads that were never part of the public
  contract are now ignored.

## 1.1.1

### Changed

- Marked the package as side-effect free via `sideEffects: false` to improve consumer tree-shaking behavior.

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
