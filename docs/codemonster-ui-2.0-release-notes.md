# CodeMonster UI 2.0 release notes

Draft changelog for the unpublished stable `2.0.0` candidate. Install the seven local tarballs together using
[Getting started](./getting-started.md#install-a-local-20-build). The stable registry installation
is documented in the [1.1 release notes](./codemonster-ui-1.1-release-notes.md).

## Package versions

All seven packages are prepared at `2.0.0`. Use the tarballs from the same candidate build.
The stable version publishes to `latest` after release acceptance and owner approval.

| Package | Version | What ships |
| --- | --- | --- |
| `@codemonster-ru/ui-tokens` | `2.0.0` | Token data, theme CSS and shared breakpoints |
| `@codemonster-ru/ui-icons` | `2.0.0` | Named icon geometry and catalog metadata |
| `@codemonster-ru/ui-runtime` | `2.0.0` | Vanilla controllers and shared behavior primitives |
| `@codemonster-ru/ui-css` | `2.0.0` | Foundation, fonts, and full and component stylesheets |
| `@codemonster-ru/ui-utilities` | `2.0.0` | Utility CSS with the matching token dependency |
| `@codemonster-ru/ui-vue` | `2.0.0` | Vue components and opt-in historical entry points |
| `@codemonster-ru/ui-layouts` | `2.0.0` | Vue layouts, regions and breakpoint composables |

Vue and Layouts require Vue `^3.5.0`. For Node consumers, including SSR, use Node `^22.22.3`,
`^24.15.0`, or `>=26.0.0` where declared by the package.

## Added

- Vue and Vanilla reference sites with interactive component previews, copyable examples, and links
  to the developer guides.
- A dedicated Layouts package for shells, page layouts, regions and shared breakpoint helpers.
- Opt-in historical Vue and Layouts entry points for incremental migration, including component
  subpaths with automatic CSS in browser builds and CSS-free entries for server rendering.
- Classic and Duotone icon geometry and catalog metadata through the framework-independent Icons
  package.
- Badge has an [outline variant](./components/display.md#props-and-states) for category labels in Vue
  and Vanilla HTML.

## Changed

- The theme supports light, dark and system preference. CSS resolves system mode, and applications
  can use a cookie to set the initial preference during server rendering.
- Shared runtime behavior covers keyboard interaction, focus, form state and navigation in both
  adapters. The documentation identifies application-owned state and progressive enhancement.

## Fixed

- Vue Skeleton preserves its DOM element when the minimum height changes.
- AdminShell and AdminLayout keep keyboard focus visible around sticky headers. Vue and Vanilla
  consumers with a custom AdminShell header can declare its initial clearance for SSR.
- Vanilla showcase previews load a single bundle of package styles, restoring interaction in
  Chromium when several embedded previews load together.
- The compact Select preview reserves space for its two-option listbox.
- Sorting the DataTable preview reorders the example rows in both directions.
- Dialog and Drawer descriptions describe how to open the previews and remain accurate when open.
- DatePicker weekday labels, adjacent dates and time labels use higher-contrast text. Calendar
  indicators distinguish today, selected dates and selected ranges in both adapters.

## Removed

- Tag and Panel, including their historical Vue imports and the `tag.css` and `panel.css` entries.
  Use [outlined Badge](./components/display.md#migrating-from-tag) for labels and
  [Card or Section](./recipes/panel.md) for grouped content.

## Migration

For VueForge projects, follow the [migration guide](./migrate-from-vueforge.md) for supported
historical names and subpaths, shared CSS, theme ownership and layout slots. Select and DatePicker
use component-owned controls. Follow the [forms guide](./components/forms.md) for labels, form
association and application-owned validation. Existing CodeMonster UI consumers can use the
[Vue quick start](./getting-started.md#vue-quick-start) and the [Vanilla guide](./vanilla.md).
