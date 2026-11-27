# Changelog

All notable changes to this package will be documented in this file.

## 2.0.2

Publish this package from the rewritten UI history with fresh npm provenance.

## 2.0.1

Update the installation and migration instructions to use the published CodeMonster UI packages.

## 2.0.0

Ship the stable layout catalog, shared breakpoints, and opt-in historical entries.

Keep focused navigation visible in sticky administrative layouts.

## 2.0.0-rc.2

Update dependency and peer ranges for the coordinated CodeMonster UI 2.0 release candidate.

## 2.0.0-rc.1

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
