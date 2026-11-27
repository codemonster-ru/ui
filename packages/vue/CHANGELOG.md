# Changelog

All notable changes to this package will be documented in this file.

## 2.0.2

Publish this package from the corrected commit history with fresh npm provenance.

## 2.0.1

Publish this package from the rewritten UI history with fresh npm provenance.

## 2.0.0

Ship the stable Vue components and historical entry points. Skeleton keeps its DOM element when its minimum height changes.

Use `CmBadge variant="outline"` in place of `CmTag`, and use `CmCard` or `CmSection` in place of
`CmPanel`. The Tag and Panel components, their historical aliases, and their historical subpaths
were removed.

## 2.0.0-rc.2

Update dependency and peer ranges for the coordinated CodeMonster UI 2.0 release candidate.

## 2.0.0-rc.1

### Added

- `CmTag`, `CmTableOfContents`, `CmColumnChooser`, `CmStepper`, `CmNavMenu`, `CmMenuBar`, and
  `CmThemeSwitch`.

### Changed

- `CmThemeSwitch` replaces `VfThemeSwitch` and shares almost none of its API. The old control was a
  two-position toggle driven by an application-mounted provider; this one is three-state over
  `light`, `dark`, and `system`, and the subsystem behind it belongs to the kit. Unknown attributes
  fall through to the root element, so a bare rename renders the old props as DOM attributes rather
  than reporting them.
- Every component is now compared against its canonical fixture on both adapters. Nine contracts had
  a Razor parity test and no Vue comparison, so the canonical markup was enforced on one side only.

## 1.1.0

### Added

- Adds the portable Fieldset, IconButton, ProgressBar, and ProgressSpinner adapters.
- Adds Input clear and password actions, Switch thumb content, Select and DatePicker clear actions,
  and CommandPalette asynchronous states.
- Adds DataTable page-size requests, pagination summaries, selection eligibility, visible-column
  ordering, and localizable interaction labels.

### Changed

- Expands Accordion item content, navigation and overlay composition, and layout root-attribute
  parity without adding framework-specific shared APIs.
- Points repository, issue tracker, and homepage metadata at the dedicated CodeMonster UI
  repository.

## 1.0.0

### Added

- Promotes the registry-validated Vue component adapter from `1.0.0-rc.1` without API changes.

## 1.0.0-rc.1

### Added

- Exposes the complete stable Vue component adapter cohort for prerelease consumer validation.
- Adds controlled Dialog dismissal locking for asynchronous confirmation flows.

## 0.1.0

### Added

- Added the initial Vue 3 adapter scaffold, ESM entry, declarations, and package verification.
- Added the native `CmButton` adapter with variants, sizes, disabled state, attribute forwarding,
  and consumer class merging.
- Added Button loading state and leading and trailing icon slots.
- Added enabled and disabled Button link rendering.
- Added canonical SSR, escaping, and native event verification for Button.
- Added `CmCard` with finite semantic roots and conditional header, body, and footer regions.
- Added canonical Card SSR and escaping verification.
- Added Checkbox, Radio, Textarea, and Switch adapters with canonical SSR, native form behavior, and
  idiomatic Vue model binding.
- Added Link, Breadcrumbs, Tabs, Menu, and Dropdown adapters with canonical SSR and controlled-state
  interaction verification.
- Added Dialog, Drawer, Popover, and Tooltip adapters with canonical SSR, controlled state, focus,
  and dismissal verification.
- Added native Select and DatePicker adapters plus controlled searchable CommandPalette interaction.
- Added semantic Table slots and controlled DataTable sorting, selection, pagination, states, and SSR parity.
- Added semantic Container, Stack, Inline, Section, and Grid adapters with canonical SSR parity.
