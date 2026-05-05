# Changelog

## 1.11.0

### Changed

- Updated integration target to `@codemonster-ru/vueforge-core@^1.18.0`.
- Improved `VfAppShell` and `VfDocumentLayout` slot presence detection to ignore empty/comment-only slot content for `sidebar`/`aside`.
- Added dedicated content-body wrappers in shell/document main areas to stabilize min-size behavior and overflow/layout interactions.
- Refined shell/document sticky/grid selectors for stricter state scoping and more predictable behavior across collapsed/compact variants.
- Updated README examples to token-based layout defaults aligned with current `--vf-layout-*` conventions.

## 1.10.0

- Added new `VfErrorLayout` scaffold for reusable 404/error pages with `code`, `title`, `description`, and `actions` API
- Added `VfErrorLayout` styles and test coverage to the public package surface
- Added standalone demo entrypoint `not-found.html` and `NotFoundPage` preview
- Added `VfErrorLayout` preview section to the main showcase catalog
- Refined `VfErrorLayout` presentation defaults (centered block, muted description, surface without background/border, primary home action in demo)
- Tokenized `VfErrorLayout` spacing and typography defaults (`padding`, `code/title/description` metrics and colors) in the layout preset

## 1.9.1

- Updated integration to `@codemonster-ru/vueforge-core@^1.17.2`

## 1.9.0

- Updated integration to `@codemonster-ru/vueforge-core@^1.17.1` and `@codemonster-ru/vueforge-theme@^1.2.2`
- Switched layout-generated CSS token namespace to `--vf-layout-*` and set the default layouts theme prefix to `vf-layout`
- Added standalone demo entry pages: `app-shell.html` and `document-layout.html`
- Refined `VfAppShell` layout composition with containerized `header`, `subheader`, `body`, and `footer` structure for consistent breakpoint-bounded alignment
- Fixed `VfAppShell` grid template behavior across `content`, `sidebar-content`, and `sidebar-content-aside` modes, including compact and collapsed states
- Added development diagnostics for missing CSS tokens in `VueForgeLayouts` plugin with grouped `core/layout` reporting and runtime diagnostics hook
- Removed internal fallback token values from layout styling and presets so missing tokens are surfaced explicitly during integration
- Tokenized remaining fixed layout minimum widths and sticky zero-offset baselines in CSS (`--vf-layout-min-width`, token-based sticky offset initialization)
- Added explicit sticky layering tokens for shell/document subheaders and content-subheaders (removed inline z-index math from CSS)
- Expanded default layout preset token coverage (header/subheader/content/sidebar/aside/footer paddings and heights, section/surface tokens, edge-notch color) to avoid unresolved layout outputs
- Rebalanced default subheader sizing for a denser baseline (`2.75rem` height, `0.375rem` vertical padding)

## 1.8.1

- Fixed sticky jump in `VfAppShell` and `VfDocumentLayout` by removing negative top pull for content subheaders in sticky scenarios
- Switched sticky top offset calculations for `subheader`, `content-subheader`, `sidebar`, and `aside` to runtime measured header/subheader heights to avoid micro-shifts while scrolling
- Added shared `useObservedElementHeight` composable for reliable runtime sticky offset synchronization
- Updated demo previews for `VfAppShell` and `VfDocumentLayout` with fixed-height scroll frames and long sidebar/content/aside fixtures for sticky-scroll validation
- Fixed `VfAppShell` demo preview overflow behavior so preview scrolling remains active in fixed-height mode

## 1.8.0

- Updated integration to `@codemonster-ru/vueforge-core@^1.16.3`
- Added optional shell subheader rows: `VfSubheaderArea` and `VfContentSubheaderArea`
- Added `subheader` and `content-subheader` support to `VfDocumentLayout` with `showSubheader` and `showContentSubheader` controls
- Added dedicated content-subheader theme tokens: `contentSubheaderBackground` and `contentSubheaderBorder`
- Unified `VfAppShell` and `VfDocumentLayout` usage around `slot + props` structured layout composition
- Improved sticky offset behavior so header/subheader/content-subheader combinations remain aligned with sticky sidebar and aside columns
- Refined plain column behavior so content subheaders also render as plain when content is plain
- Fixed demo compact-shell templates to keep subheader placement stable on `lg` breakpoints
- Fixed `VfDocumentLayout` edge-notch layering so header notches remain visible while subheaders are shown

## 1.7.2

- Updated integration to `@codemonster-ru/vueforge-core@^1.15.0`
- Unified default shell and document area padding to `1rem`
- Removed the unused `spaceLayoutCompact` token from the public layout token layer

## 1.7.1

- Updated `VfDocumentLayout` container chrome so inset and side borders apply only from `md` and above
- Refined demo previews and tests to match the updated `VfDocumentLayout` container behavior

## 1.7.0

- Replaced the old mobile layout mode in `VfAppShell` and `VfDocumentLayout` with runtime breakpoint-driven `compact-sidebar` and `compact-aside` states
- Aligned layout compaction with `vueforge-core` breakpoint tokens so `sidebar` hides below `lg` and `aside` hides below `xl`, including live updates when breakpoint tokens change at runtime
- Updated demo previews and tests to reflect the new breakpoint-driven layout behavior

## 1.6.0

- Updated integration to `@codemonster-ru/vueforge-core@^1.14.0`, `@codemonster-ru/vueforge-icons@^1.1.1`, and `vite@^6.4.2`
- Hid the right `aside` column for `VfAppShell` and `VfDocumentLayout` in `sidebar-content-aside` mode on `lg` and smaller layouts
- Switched `VfAppShell`, `VfDocumentLayout`, and the demo breakpoint logic to runtime CSS breakpoint token tracking so layouts react to live theme/token changes without a rebuild
- Refined the demo layout previews to match compact-aside behavior across breakpoints and updated the theme switch presentation

## 1.5.0

- Added optional `edgeNotches` support to `VfDocumentLayout` with built-in triangular header/footer join markers and demo controls
- Added layout tokens for document edge notch sizing/offset, sticky header z-index, and viewport height overrides
- Centralized the default layout mobile breakpoint and removed duplicated hardcoded mobile CSS breakpoint handling
- Updated integration to `@codemonster-ru/vueforge-core@^1.11.0` and `@codemonster-ru/vueforge-icons@^1.1.0`

## 1.4.3

- Added optional `fillViewport` support for `VfAppShell` and `VfDocumentLayout` so layouts can stretch to the viewport height without making that behavior the default
- Updated integration to `@codemonster-ru/vueforge-core@^1.8.0`
- Switched the demo theme control to `VfThemeSwitch` from `vueforge-core`

## 1.4.2

- Fixed `VfContainer` sizing so explicit `size` variants like `size="2xl"` correctly override the default bounded width and apply the selected breakpoint-based `max-width`

## 1.4.1

- Fixed sticky `sidebar` and `aside` content alignment in `VfAppShell` and `VfDocumentLayout` so inner content no longer shifts upward by the column padding while scrolling

## 1.4.0

- Added `size` (`md`, `lg`, `xl`, `2xl`) and `fluid` variants to `VfContainer`
- Added optional `stickyHeader`, `stickySidebar`, and `stickyAside` support for `VfAppShell` and `VfDocumentLayout`
- Updated integration to `@codemonster-ru/vueforge-core@^1.4.0`
- Refined demo coverage for theme modes and sticky layout behavior

## 1.3.0

- Added `VueForgeLayouts` plugin with install-time theme configuration
- Added support for configuring both `theme.layouts` and `theme.core` from a single `app.use(VueForgeLayouts, ...)` call
- Updated `VueForgeLayouts` to install `VueForgeCore` internally and forward `defaultTheme`, `themeStorageKey`, and `themeAttribute`
- Refined `VfDocumentLayout` structure, defaults, and demo presentation for bounded document-style layouts
- Simplified `VfAppShell` into a layout-focused component by removing built-in mobile drawer behavior and related sidebar-open API
- Removed drawer-specific props from `VfSidebarArea`, dropped `#sidebar-mobile` support from `VfAppShell` and `VfDocumentLayout`, and removed public `useSidebarState` / `useScrollLock` exports
- Switched internal multi-theme application to `applyThemeConfigs(...)` from `@codemonster-ru/vueforge-theme`
- Switched layout token baseline generation to `defaultLayoutsPreset` and moved generated theme artifacts to `.generated/theme`
- Updated integration to `@codemonster-ru/vueforge-core@^1.4.0` and `@codemonster-ru/vueforge-theme@^1.1.0`
- Refined README, demo examples, and test coverage for theme configuration and theme mode integration

## 1.2.0

- Added layout theme runtime powered by `@codemonster-ru/vueforge-theme`
- Added `createLayoutsPreset`, `applyLayoutsThemeConfig`, and related layout theme helpers
- Added configurable layout tokens for shell dimensions, spacing, container and section sizing
- Added shell chrome theme tokens for app, header, sidebar, aside, and footer backgrounds and borders
- Updated documentation and tests to cover runtime layout theme configuration

## 1.1.0

- Updated `@codemonster-ru/vueforge-core` integration to `^1.2.0`
- Switched mobile shell sidebar to `VfDrawer` from `vueforge-core`
- Added `plain` appearance support for `VfSidebarArea` and `VfAsideArea`
- Added `#sidebar-mobile` support to `VfAppShell` for dedicated mobile sidebar content
- Improved demo behavior for bounded mobile sidebar previews and shell configuration examples
- Cleaned up build and publish output, including removing declaration source maps from the published package
- Refined package metadata, audit state, and release readiness

## 1.0.0

- Initial stable release of `@codemonster-ru/vueforge-layouts`
- Added layout primitives: `VfContainer`, `VfStack`, `VfInline`, `VfSection`, `VfGrid`
- Added shell components: `VfAppShell`, `VfHeaderArea`, `VfSidebarArea`, `VfContentArea`, `VfAsideArea`, `VfFooterArea`
- Added responsive composables: `useBreakpoint`, `useBreakpoints`, `useBreakpointValue`, `useSidebarState`, `useScrollLock`
- Added layout tokens for spacing, breakpoints, surfaces, borders, and elevation
- Added demo page and test coverage for shell state, responsive behavior, and local area overrides
