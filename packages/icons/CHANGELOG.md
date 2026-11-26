# Changelog

All notable changes to this package will be documented in this file.

## 2.0.1

Generate the icon geometry from local SVG data. Document installation from npm and generation from
a CodeMonster UI checkout.

## 2.0.0

Ship the framework-independent icon geometry and catalog for CodeMonster UI 2.0.

## 2.0.0-rc.2

Version bump for the coordinated CodeMonster UI 2.0 release candidate.

## 2.0.0-rc.1

### Added

- The package. It holds the rendered geometry of 116 icons across two families and four variants as
  data, generated from the VueForge renderer rather than reimplemented.
- One module per icon, so a consumer using five ships roughly 3 KB gzipped rather than the 26 KB the
  whole set weighs. The Annabel Razor adapter reads one JSON file per icon for the same reason.
- `resolveCmIcon`, which falls back to the form an icon actually has. A brand mark has one canonical
  rendering, so asking for a thin-stroke logo is answered rather than refused.
