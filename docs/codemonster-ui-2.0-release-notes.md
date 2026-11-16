# CodeMonster UI 2.0 release notes

Draft changelog for the internal `2.0.0-rc.2` build. Install the seven local tarballs together using
[Getting started](./getting-started.md#install-a-local-20-build). The stable registry installation
is documented in the [1.1 release notes](./codemonster-ui-1.1-release-notes.md).

## Package versions

The current internal candidate is `2.0.0-rc.2` for each package below. The coordinated version
keeps the prerelease dependency and peer ranges aligned. The tag workflow selects the `next`
channel for a separately approved prerelease. Stable `2.0.0` requires a fresh qualification run
with stable manifests, dependency ranges and changelog sections.

| Package | Internal candidate | What ships |
| --- | --- | --- |
| `@codemonster-ru/ui-tokens` | `2.0.0-rc.2` | Token data, theme CSS and shared breakpoints |
| `@codemonster-ru/ui-icons` | `2.0.0-rc.2` | Named icon geometry and catalog metadata |
| `@codemonster-ru/ui-runtime` | `2.0.0-rc.2` | Vanilla controllers and shared behavior primitives |
| `@codemonster-ru/ui-css` | `2.0.0-rc.2` | Foundation, fonts, and full and component stylesheets |
| `@codemonster-ru/ui-utilities` | `2.0.0-rc.2` | Utility CSS with the matching token dependency |
| `@codemonster-ru/ui-vue` | `2.0.0-rc.2` | Vue components and opt-in historical entry points |
| `@codemonster-ru/ui-layouts` | `2.0.0-rc.2` | Vue layouts, regions and breakpoint composables |

Vue and Layouts require Vue `^3.5.0`. For Node consumers, including SSR, use Node `^22.22.3`,
`^24.15.0`, or `>=26.0.0` where declared by the package.

## Added

- Vue and Vanilla reference sites with a searchable component catalog, interactive previews,
  copyable examples, integrated guides and a Release Workspace demo.
- A dedicated Layouts package for shells, page layouts, regions and shared breakpoint helpers.
- Opt-in historical Vue and Layouts entry points for incremental migration, including component
  subpaths with automatic CSS in browser builds and CSS-free entries for server rendering.
- Classic and Duotone icon geometry and catalog metadata through the framework-independent Icons
  package.

## Changed

- The theme supports light, dark and system preference. CSS resolves system mode, and applications
  can use a cookie to set the initial preference during server rendering.
- Shared runtime behavior covers keyboard interaction, focus, form state and navigation in both
  adapters. The documentation identifies application-owned state and progressive enhancement.

## Fixed

- Matching `Vue` in site search now surfaces local installation and Vue quick start first.
- The compact Select preview reserves space for its two-option listbox.
- Sorting the DataTable preview reorders the example rows in both directions.
- Dialog and Drawer descriptions describe how to open the previews and remain accurate when open.
- DatePicker weekday labels, adjacent dates and time labels use higher-contrast text. Calendar
  indicators distinguish today, selected dates and selected ranges in both adapters.

## Migration

For VueForge projects, follow the [migration guide](./migrate-from-vueforge.md) for supported
historical names and subpaths, shared CSS, theme ownership and layout slots. Select and DatePicker
use component-owned controls. Follow the [forms guide](./components/forms.md) for labels, form
association and application-owned validation. Existing CodeMonster UI consumers can use the
[Vue quick start](./getting-started.md#vue-quick-start) and the [Vanilla guide](./vanilla.md).
