# Changelog

All notable changes to this package will be documented in this file.

## Unreleased

### Added

- The package, and the five layouts it exists to hold: `CmAdminLayout`, `CmAdminShell`,
  `CmSetupLayout`, `CmAppShell`, and `CmDocumentLayout`. A layout is not a component, and a separate
  package is what makes the two nameable apart.
- Layout state as `data-cm-*` attributes on the root instead of scoped slots, which PHP cannot
  consume. Controls are marked rather than wired: an application tags its own button with
  `data-cm-sidebar-toggle` or `data-cm-mobile-sidebar-toggle`, and the runtime controller listens
  for it.
- Sticky offsets published as custom properties resolved by `shellStickyOffsets`. The server emits
  the declared-height form, so the layout is correct before any script runs;
  `CmShellMetricsController` narrows it to observed heights where a browser is involved.
