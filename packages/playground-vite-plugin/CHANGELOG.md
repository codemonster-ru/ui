# Changelog

## 0.2.0

### Added

- Added correctly cased `VueForge*` aliases for all public virtual-entry option types.

### Changed

- Retained the previous `Vueforge*` type names as deprecated compatibility aliases.
- Declared Node.js 18 support, marked the ESM package as side-effect free, and included clean-checkout
  lint tooling.

### Fixed

- Normalized virtual IDs received through Vite's `/@id/__x00__` representation.

### Breaking changes

- None. Existing plugin options, virtual module IDs, and deprecated type aliases remain available.

## 0.1.1

### Changed

- Expanded Vite peer dependency support to include `vite@8` (`^6.0.0 || ^7.0.0 || ^8.0.0`).

## 0.1.0

### Added

- Initial release of `@codemonster-ru/vueforge-playground-vite-plugin`.
- `vueforgePlaygroundVirtualPlugin` for mapping virtual module ids to local files.
- Configurable `entries`, `virtualPrefix`, `pluginName`, and export modes (`default`, `namespace`, `named`).
