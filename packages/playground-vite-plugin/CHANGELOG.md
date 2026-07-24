# Changelog

## 1.0.0

### Added

- Added the correctly cased `VueForge*` names for all public virtual-entry option types.

### Changed

- Defined the correctly branded `VueForge*` virtual-entry option types as the canonical public
  contract.
- Made the package `exports` map authoritative for its ESM plugin and declarations.
- Declared Node.js 18 support, marked the ESM package as side-effect free, and included clean-checkout
  lint tooling.

### Fixed

- Normalized virtual IDs received through Vite's `/@id/__x00__` representation.

### Removed

- Removed the deprecated `Vueforge*` type aliases and legacy top-level resolver metadata.

### Breaking changes

- Rename `Vueforge*` type imports to `VueForge*` and use a resolver that honors package `exports`.

## 0.1.1

### Changed

- Expanded Vite peer dependency support to include `vite@8` (`^6.0.0 || ^7.0.0 || ^8.0.0`).

## 0.1.0

### Added

- Initial release of `@codemonster-ru/vueforge-playground-vite-plugin`.
- `vueforgePlaygroundVirtualPlugin` for mapping virtual module ids to local files.
- Configurable `entries`, `virtualPrefix`, `pluginName`, and export modes (`default`, `namespace`, `named`).
