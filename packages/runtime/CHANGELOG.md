# Changelog

## Unreleased

### Added

- `core/theme.ts`: three-state theme resolution, cookie reading and serialisation, shared by every
  adapter and by the server.
- `core/shell.ts`: `shellStickyOffsets`, which resolves a shell's sticky offsets to a measured height
  when there is one and a declared CSS variable when there is not.
- `core/tree.ts`, `core/menu-bar.ts`, `core/stepper.ts`, `core/table-of-contents.ts`: the rules the
  components carried across in this cycle needed, so neither adapter re-implements them.
- Controllers for `stepper`, `nav-menu`, `menu-bar`, `admin-layout`, `setup-layout`, `theme-switch`,
  `app-shell`, and `shell-metrics`. Five of these were named by canonical markup that had no
  implementation behind it; DOM parity compares markup, so nothing had failed.

### Changed

- Controllers read realm-sensitive constructors off the owning document's `defaultView` rather than
  the global scope. A page is one realm but a test harness driving two documents is not, and
  `instanceof` against the wrong realm reports false rather than failing, so the controller silently
  does nothing. `no-restricted-globals` now rejects the value position while leaving types alone.

## 1.1.0

### Added

- Adds progressive enhancement for Input clearing and password visibility plus Select clearing.
- Adds DataTable page-size requests, pagination summaries, selection eligibility, and localizable
  interaction labels.
- Adds CommandPalette loading and idle-state synchronization for asynchronous results.

### Changed

- Points repository, issue tracker, and homepage metadata at the dedicated CodeMonster UI
  repository.

## 1.0.0

- Promotes the registry-validated progressive-enhancement contract from `1.0.0-rc.1` without API
  changes.

## 1.0.0-rc.1

- Exposes the complete progressive-enhancement controller contract for prerelease consumer
  validation.
- Respects server-rendered Dialog dismissal locks for close controls and Escape.

## 0.1.0

- Scaffold the framework-independent CodeMonster UI runtime package.
- Add the Checkbox controller that restores the native indeterminate property after server render.
- Add Tabs, Menu, and Dropdown controllers with canonical keyboard and disclosure behavior.
- Add Dialog and Drawer modal focus controllers plus Popover and Tooltip progressive enhancement.
- Add CommandPalette filtering, active-descendant navigation, selection, and modal requests.
- Add DataTable sort, selection, and page-request progressive enhancement.
