# Changelog

## 1.32.0

### Added

- Added foundation tokens for border width, round radius, visually hidden geometry, and configurable control line height.
- Added component tokens for button icon scale, loading spinner size, selection-control geometry, stepper, data table, alert, tabs, drawer, and form-control sizing details.

### Changed

- Aligned `sm`, `md`, and `lg` `VfAvatar`, `VfButton`, `VfIconButton`, `VfInput`, and `VfSelect` geometry to the shared `28px` / `36px` / `40px` control scale.
- Updated large control typography and button icon/loading-spinner sizes to `18px`; small and medium sizes remain `14px` and `16px`.
- Made default icons inside `VfButton` inherit its size context while preserving an explicitly supplied icon `size`.
- Moved remaining configurable core component geometry and visual values to theme tokens.

### Fixed

- Prevented button and field content line boxes from expanding controls beyond their configured control heights.
- Fixed `VfDataTable` loading spinner sizing by using a non-cyclic token alias.

## 1.31.0

### Added

- Added `VfAvatar` for image, initials, icon, and custom fallback content with square and circle shapes.
- Added `sm`, `md`, and `lg` avatar sizes, root and subpath component exports, auto-loaded CSS, and standalone `avatar.css`.
- Added avatar theme tokens for colors, radius, sizes, and label/icon typography.
- Added `VfAvatar` documentation and core playground coverage with image, label, icon, and slot examples.

### Changed

- Defined avatar sizing independently from form control heights: `24px`, `32px`, and `40px` containers with matching `12px`, `16px`, and `20px` label/icon scales.

## 1.30.0

### Added

- Added `striped` and `animated` variants to `VfProgressBar` for active determinate progress states.
- Added progress bar striped pattern theme tokens.
- Added progress bar documentation and playground examples for static striped, animated striped, and dynamic animated striped states.

### Fixed

- Preserved `VfInput` password cursor position when toggling password visibility.

## 1.29.0

### Added

- Added `VfField` `required` support with an aria-hidden required marker for regular and floating labels.
- Exposed `required` in the `VfField` default slot context so consumers can forward required semantics to the rendered control.
- Added theme tokens for floating field geometry, selection-control offsets, overlay motion defaults, inline spinner colors, skeleton gate defaults, and navigation current-state defaults.

### Changed

- Moved remaining core component CSS variable literal defaults into the default theme preset so component CSS consumes tokenized values consistently.
- Expanded component theming documentation for the newly tokenized core surfaces.

### Fixed

- Preserved `VfField` responsibility boundaries by not applying native `required` automatically to unknown slotted controls.

## 1.28.0

### Added

- Added `VfButton` `loading` prop with an inline spinner, native disabled state, and `aria-busy` semantics.
- Added button loading coverage to the core playground visual QA matrix and documented the new prop.

### Fixed

- Included progress spinner styles in the `button.css` entry so `@codemonster-ru/vueforge-core/button` loading buttons render correctly with auto-CSS imports.
- Scoped button loading spinner colors to the button text color so each visual variant keeps appropriate contrast.

## 1.27.0

### Added

- Added `VfDataTable` for data-driven table rendering with columns, rows, density, mask and skeleton loading, pagination, empty, striped, sticky header, and column divider support.
- Added `VfTable` `columnDividers` prop for opt-in vertical column separators.

### Fixed

- Aligned `VfTable` caption spacing with table cells so captions no longer appear offset from column content.

## 1.26.0

### Added

- Added `VfProgressBar` for determinate and indeterminate progress states with tone, value-label, sizing, auto-CSS, and standalone CSS exports.
- Added `VfProgressSpinner` for circular loading indicators with tone, sizing, auto-CSS, and standalone CSS exports.
- Added progress component documentation and playground examples.

### Changed

- Updated `VfSkeleton` default radius to use the shared surface radius token.
- Tokenized `VfSkeleton` shimmer color through semantic palette tokens and removed the separate dark-theme shimmer override.
- Updated `VfSkeletonGate` so ready content does not receive a default forced border radius.

### Fixed

- Extended core component coverage for progress components and skeleton gate ready-state radius behavior.

## 1.25.0

### Added

- Added `VfField` and `VfFieldset` form container components with package, auto-CSS, and standalone CSS exports.
- Added form wrapper documentation for labels, descriptions, errors, floating labels, and grouped controls.
- Added form geometry contract coverage for text controls, selection controls, field containers, floating labels, states, adornments, and sizes.

### Changed

- Expanded core playground visual QA matrices across actions, overlays, surfaces, feedback, forms, navigation, and modal launchers.
- Refined form control geometry for labels, helper/error text, adornments, invalid states, disabled states, and floating label variants.
- Extended theme typing and default preset tokens for the new field and form geometry surface.

### Fixed

- Included Skeleton Gate styles in the combined core component CSS and async CSS entry so loading overlays render correctly with aggregate style imports.
- Improved demo anchor scrolling so section headings remain visible beneath the sticky showcase navigation.

## 1.24.1

### Fixed

- Fixed packaged component CSS exports so entry styles are published with resolved local imports, restoring `@codemonster-ru/vueforge-core/stepper` auto-CSS consumption.

## 1.24.0

### Added

- Added new `VfStepper` component for horizontal and vertical multi-step flows with controlled/uncontrolled active value support.
- Added `contentPosition` support to `VfStepper` for alternate label/description placement across horizontal and vertical layouts.
- Added root package export for `VfStepperContentPosition`.

### Docs

- Added `VfStepper` documentation (features, API, theming).

## 1.23.0

### Added

- Added `passwordReveal` support to `VfInput` for password visibility toggles.

### Fixed

- Preserved uncontrolled `VfInput` values when internal UI state changes, including password visibility toggles.
- Preserved external classes on `VfLink` instead of replacing them with generated link classes.

### Docs

- Documented the `VfInput` password reveal option.

## 1.22.2

### Fixed

- Restored overlay and floating transition states in component CSS entries so auto-CSS subpath imports preserve animations.

## 1.22.1

### Fixed

- Stabilized `VfThemeSwitch` SSR hydration by deferring `checked` synchronization with `resolvedTheme` until `onMounted`.
- Improved initial theme resolution in `VfThemeProvider` by reading the current root theme attribute before falling back to `initialTheme`.

### Changed

- Marked auto-CSS JS proxies as side effects (`dist/auto/*.js`) so bundlers retain CSS-loading entry wrappers.

## 1.22.0

### Added

- Added new async utility export `@codemonster-ru/vueforge-core/async` with `createAsyncWithSkeleton` for reusable lazy-loading wrappers with built-in skeleton fallback.
- Added `normalizeContentSpacing` prop to `VfSkeletonGate` to normalize outer margins of direct slotted children and reduce skeleton/content height mismatch.

### Changed

- Published `./async` through component-style auto-CSS proxy flow (`dist/auto/async.js`) with dedicated `async.css` entry that imports `skeleton.css`.
- Extended release smoke coverage so component JS auto-CSS checks also validate the `./async` subpath contract.

### Docs

- Added async loading guide: `SkeletonGate + Async Recipe`.
- Updated Skeleton Gate docs (API + features) with `normalizeContentSpacing` behavior and usage.

## 1.21.0

### Added

- Added advanced Skeleton Gate height-stability controls: `reserveHeight` and `preserveLastHeight` for smoother loading transitions and reduced layout shift.

### Changed

- Updated `VfSkeleton` shimmer rendering to a softer, tokenized overlay-based animation for cleaner visual output in dark themes.
- Extended Skeleton theming token surface for shimmer geometry and trajectory control (`inset`, `width`, `rotate`, `start-x`, `end-x`, `blur`).
- Synced playground example resolver aliases so core skeleton subpath imports are always sourced from current package source during local development.

### Docs

- Updated Skeleton and Skeleton Gate documentation (API/features/theming) to reflect current props, usage patterns, and token set.

## 1.20.1

### Fixed

- Moved `VfSkeleton` and `VfSkeletonGate` styles from local `scoped` blocks into their component CSS entries (`skeleton.css`, `skeleton-gate.css`) so subpath imports keep consistent auto-CSS behavior.
- Updated Skeleton and Skeleton Gate docs examples to use component JS subpath imports (`@codemonster-ru/vueforge-core/skeleton` and `@codemonster-ru/vueforge-core/skeleton-gate`).

## 1.20.0

### Added

- Added component-level JS entrypoints with automatic CSS side-effect loading (auto-CSS imports) for more ergonomic point usage.
- Added stable per-component CSS entry consumption flow for selective style imports.

### Changed

- Refined component CSS entry architecture for more predictable per-component style consumption and cleaner dependency flow.
- Tightened style quality by manually normalizing selector ordering and duplicate blocks across core entries.
- Kept `no-descending-specificity` override only for interaction-matrix files (`accordion`, `checkbox`, `radio`, `switch`) and documented this as an explicit design choice in-file.

### Fixed

- Updated command-palette line-clamp declarations for better standard + webkit compatibility and cleaner lint behavior.
- Stabilized consumer-level CSS export smoke coverage for component JS auto-CSS entrypoints.

## 1.19.0

### Added

- Added new loading primitives: `VfSkeleton` and `VfSkeletonGate`.
- Exported `VfSkeleton` and `VfSkeletonGate` from `@codemonster-ru/vueforge-core` component and package entrypoints.
- Added component coverage for skeleton sizing and skeleton-gate ready-state behavior.

## 1.18.9

### Changed

- Switched foundation breakpoint source to `@codemonster-ru/vueforge-theme` to remove duplicated breakpoint definitions in `@codemonster-ru/vueforge-core`.
- Updated default theme preset breakpoint token derivation to use the shared `vfBreakpoints` export.

## 1.18.8

### Fixed

- Refined `vf-prose` vertical rhythm by separating heading top spacing from heading-following content spacing, so heading transitions render more consistently across prose blocks.
- Updated the default `proseHeadingMargin` token value to `1.5rem` for more predictable spacing scale.

## 1.18.7

### Fixed

- Added temporary DOM observation to `useTableOfContents()` so async SPA/SSG page headings that render after scheduled updates still become active without requiring scroll or resize.

## 1.18.6

### Fixed

- Added a deferred `requestAnimationFrame` retry to `useTableOfContents()` so async SPA/SSG page headings can become active without requiring the first user scroll.

## 1.18.5

### Fixed

- Recomputed `useTableOfContents()` active heading after mount and after reactive `items`/`offset` changes, so SPA navigation highlights the visible section before any user scroll.

## 1.18.4

### Fixed

- Corrected published declaration paths for the `./foundation` and `./theme` subpath exports.
- Added the missing `./theme.css` package export and covered it in the foundation contract test.
- Ensured bundled component styles include the generated token and theme fallback CSS.

## 1.18.3

### Fixed

- Updated the `vf-prose` inline-code selector to use complex `:not()` notation for stylelint compatibility without changing prose exclusion behavior.

## 1.18.2

### Changed

- Added first-class prose escape support for embedded interactive components:
  - introduced official `.vf-prose-exclude` escape class for prose containers
  - excluded `.vf-playground` and `.vf-codeblock` descendants from `vf-prose` typography selectors out of the box
  - preserved prose vertical rhythm between direct children, including escaped blocks and embedded playground/codeblock roots
- Added prose CSS contract coverage to prevent regressions in exclude behavior and block-spacing flow.
- Documented the prose escape hatch and auto-excluded component roots in the visual baseline docs.

## 1.18.1

### Fixed

- Refined `VfMenuBar` popup positioning after horizontal-scroller integration:
  - stabilized root submenu teleport overlay behavior in constrained containers
  - fixed nested submenu rendering/placement regressions caused by mixed positioning contexts
  - improved submenu interaction consistency for hover/click branch navigation
- Improved `VfTabs`/`VfMenuBar` shared horizontal-scroller behavior and related navigation styles for more stable overflow UX.

## 1.18.0

### Changed

- Expanded and normalized theme token coverage with reusable size primitives (`iconSizeSm`/`Md`/`Lg`/`Xl`) and broader token-to-token mappings across navigation, overlays, tables, badges, tags, and tooltip sizing.
- Refined default light/dark semantic palette values (`primary`, `info`, `warn`, `help`, `success`) and focus/overlay color mixing for more consistent contrast behavior.
- Updated component style internals to consume normalized token aliases in actions, navigation, overlays, surfaces, and feedback layers.
- Tuned menu and nav item spacing/padding defaults and top-level menu-bar item inline padding for denser, more consistent rhythm.
- Aligned typography defaults for `headingH6` and prose inline code to shared token scales.

## 1.17.7

### Changed

- Removed `size` support from `VfTabs` (`sm`, `md`, `lg`) and aligned the component to a single size behavior.
- Removed automatic `scrollIntoView` call from `VfTabs` indicator sync to prevent page-level scroll jumps during page refresh and initial render.
- Updated `VfTabs` overflow behavior so long tab lists scroll horizontally inside component bounds instead of stretching adjacent layout.
- Improved `VfTabs` active-indicator behavior during horizontal scroll:
  - keeps indicator position synced with scrolled content
  - clips indicator width to the visible viewport
  - hides indicator when active tab is fully out of view
  - disables transition while scrolling to avoid lagging "floating" motion
- Added dynamic scroll-edge hints for `VfTabs` that appear only when content is actually hidden on the left or right side.
- Added side scroll buttons for `VfTabs` that appear only when tab content is clipped and allow quick left/right navigation.
- Added/updated `VfTabs` theme tokens for scroll controls, backgrounds, focus ring, fade overlays, and disabled tab color.
- Updated `VfTabs` showcase examples to remove size variants and reflect the current single-size API.
- Added regression coverage for overflow scroll controls and removed obsolete size-prop coverage.

## 1.17.6

### Changed

- Added `size` support to `VfTabs` with `sm`, `md`, and `lg` variants and corresponding tab sizing styles.
- Updated `VfTabs` overflow behavior so long tab lists scroll horizontally inside component bounds instead of stretching adjacent layout.
- Improved `VfTabs` active-indicator behavior during horizontal scroll:
  - keeps indicator position synced with scrolled content
  - clips indicator width to the visible viewport
  - hides indicator when active tab is fully out of view
  - disables transition while scrolling to avoid lagging "floating" motion
- Added dynamic scroll-edge hints for `VfTabs` that appear only when content is actually hidden on the left or right side.
- Expanded `VfTabs` showcase examples to demonstrate all supported sizes (`sm`, `md`, `lg`) with overflow scenarios.
- Added regression coverage for `VfTabs` size class application.

## 1.17.5

### Changed

- Updated `VfTabs` so the `tabpanel` block is rendered only when the `panel` slot is provided, allowing use as a standalone tab switcher without empty content containers.
- Added regression coverage to ensure `VfTabs` does not render `role="tabpanel"` when no `panel` slot is passed.

## 1.17.4

### Changed

- Refined `vf-prose` inline code styling so code snippets remain recognizable while aligning better with surrounding prose text.
- Aligned `vf-prose` inline and block code treatments with shared mono sizing, text color, radius, and muted color-mix backgrounds.
- Updated prose code tokens so inline code uses a fixed `0.875rem` font size with balanced padding.

## 1.17.3

### Changed

- Reworked `vf-prose` vertical rhythm rules to make top-level spacing predictable across semantic content combinations (`headings`, `paragraphs`, `lists`, `blockquotes`, `code blocks`, and `hr`).
- Resolved multiple prose spacing regressions caused by selector ordering and margin resets, ensuring intended spacing rules are not overridden by list/blockquote reset styles.
- Added explicit `vf-prose hr` styling based on theme border tokens so separators remain visually consistent in both light and dark themes.
- Added `proseHrBorderWidth` and `proseHrOpacity` theme tokens for prose separator customization.
- Refined `vf-prose` blockquote layout by removing vertical inner padding to align visual rhythm with surrounding prose blocks.
- Expanded `vf-prose` demo coverage with a spacing matrix that exercises common block-to-block transitions for easier visual QA.
- Updated dependency range for `@codemonster-ru/floater.js` to `^1.0.8`.

## 1.17.2

### Changed

- Updated navigation and table-of-contents token references from `level0` to `level-0` CSS variable names, restoring nested indentation for `VfNavMenu` simple variants after the serializer update.
- Updated heading utility/prose token references from `--vf-heading-h1-*` … `--vf-heading-h6-*` to `--vf-heading-h-1-*` … `--vf-heading-h-6-*` to match generated token names.
- Replaced stale `--vf-radius-sm` references in form clear buttons with `--vf-radius-control-tight`.

## 1.17.1

### Changed

- Updated `@codemonster-ru/vueforge-theme` to `^1.2.2`, which fixes CSS variable serialization for numeric token suffixes (for example, `breakpoint2xl` now serializes to `--vf-breakpoint-2xl`).
- Added regression coverage in the theme bridge tests to keep `--vf-breakpoint-2xl` serialization stable.

## 1.17.0

### Added

- Added new `VfCommandPalette` component with:
  - keyboard-first navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`)
  - controlled/uncontrolled query support
  - default docs-style result rendering
  - default footer keyboard hints
  - extensibility slots for custom item/footer rendering
- Added `VfInput` support for:
  - `leadingIcon` / `trailingIcon`
  - `clearable` clear-action button
  - `leading` / `trailing` slots for custom adornments
- Added `VfSelect` support for:
  - `leadingIcon` / `trailingIcon`
  - `clearable` clear-action button
  - `leading` / `trailing` slots for custom adornments
- Added new field and command-palette theme tokens to replace hardcoded icon/adornment sizing and spacing values.

### Changed

- Updated `@codemonster-ru/vueforge-icons` to `^1.2.0`.
- Refined command palette result-item interactions:
  - consistent hover/keyboard-active behavior
  - improved matched-text highlighting behavior for title vs breadcrumb/snippet
  - right-side enter icon visibility aligned with active/hover state
- Aligned `vf-input` and `vf-select` demo blocks to the same example order and coverage.
- Improved select clear/trailing icon layout to avoid right-side icon overlap.

## 1.16.3

### Added

- Added `VfDrawer` fullscreen sizing via `size="full"` and exported `VfDrawerSize` in the public type API.

### Changed

- Added fullscreen drawer layout styles for all drawer placements (`left`, `right`, `top`, `bottom`) so full-screen mode behaves consistently regardless of direction.
- Improved overlay scroll locking by compensating `document.body` right padding for scrollbar width while locked, preventing layout shift on open/close.
- Expanded drawer demo coverage with separate regular and fullscreen examples, including a fullscreen drawer example that opens from the left.

## 1.16.2

### Changed

- Added shared `selectableColor` token and aligned default inactive item/link colors in navigation-style components (`VfDropdown`, `VfBreadcrumbs`, `VfTabs`, `VfAccordion`, `VfNavMenu`, `VfMenuBar`, `VfTableOfContents`) to use it, while active states stay on `primary` via `--vf-selectable-active-color`.
- Added dedicated `VfSelect` option tokens (`selectOption*`) that default to the shared selectable token family, so select option colors can be overridden independently from dropdown menus.
- Increased default contrast for `VfNavMenu` group labels by setting `navMenuGroupLabelColor` to `--vf-color-text` instead of a muted mix.
- Added `menuBarTopItemFontWeight` token and applied it to top-level `VfMenuBar` items so the whole first level can be consistently emphasized without mixing weights item-by-item.
- Added `navMenuTopItemFontWeight` token and applied it to top-level `VfNavMenu` items so root-level branch and leaf items share the same weight.
- Fixed `VfNavMenu` collapse-close motion in `pills` variant by moving collapse spacing from `margin-top` to `padding-top`, removing the end-of-animation snap.
- Refined the same `VfNavMenu` collapse fix by applying top spacing to the nested list inside the collapse container (instead of the animated container itself), eliminating residual close snap.
- Set default `alertBodyColor` to `--vf-color-muted` for more consistent secondary-content tone.
- Added `selectOptionDisabledColor` token and explicit disabled-option styling for `VfSelect` menu items.

## 1.16.1

### Changed

- Refined `VfNavMenu` and `VfTableOfContents` nesting tokens to use the generated `level0` variable names consistently, restoring expected nested indentation.
- Restored filled active state for `VfTableOfContents` in `pills` variant by wiring `tableOfContentsPillsActiveBackground` to `--vf-selectable-active-background`.
- Updated `VfDropdown` hover selectors so active items keep their active background on hover in both `default` and `pills` variants.
- Rebalanced heading scale:
  - `h1` reduced to `30px`
  - `h2–h6` scaled down proportionally and rounded to whole-pixel values (`26px`, `23px`, `19px`, `17px`, `14px`)
- Updated `vf-prose` color hierarchy:
  - body text now uses muted tone
  - headings use contrast tone
  - dark theme headings are rendered white

## 1.16.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- Introduced typography and content utility classes, including:
  - heading scale utilities (`vf-heading`, `vf-heading-h1` … `vf-heading-h6`)
  - text utilities (`vf-text-body`, `vf-text-label`, `vf-text-caption`, tone helpers, and link/code helpers)
  - content utilities (`vf-list-*`, `vf-blockquote`, `vf-prose`, `vf-sr-only`, truncation and wrapping helpers)
- Added dedicated theme tokens for typography/content utilities so heading, link, code, list, blockquote, and prose rhythm can be customized via tokens.
- Expanded demo coverage with a dedicated Typography section and examples for all new utilities.

### Changed

- Switched theme token injection to a single runtime source via plugin application (removed static token/theme CSS side-effect imports from package entry).
- Moved base color-scheme/form-font defaults into component base styles so default behavior remains stable with single-source theme injection.
- Added TypeScript module declaration support for side-effect CSS imports (`declare module "*.css"`).

## 1.15.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- `VfDrawer` now supports:
  - `dividers`
  - `drawerHeaderMinHeight` and `drawerFooterMinHeight` theme tokens
- `VfDialog` now supports:
  - `dividers`
  - `dialogDividerColor`, `dialogHeaderMinHeight`, and `dialogFooterMinHeight` theme tokens
- `VfThemeSwitch` button mode now supports `buttonVariant="secondary" | "ghost"`

### Changed

- Aligned `VfDialog` section layout with `VfDrawer` so header, body, and footer manage their own padding instead of relying on container padding
- Updated dialog and drawer dividers to use inset separators aligned with section padding
- Increased the default close-button size in `VfDialog` and `VfDrawer` headers to `md`
- Expanded demo coverage for:
  - dialog and drawer footers
  - dialog and drawer divider presentation
  - `VfThemeSwitch` ghost button variants

## 1.14.0

Minor release for `@codemonster-ru/vueforge-core`.

### Changed

- Applied `border-box` sizing consistently across VueForge component elements and internal parts
- Rebalanced `VfSwitch`, `VfCheckbox`, and `VfRadio` sizing after the sizing-model update to preserve their intended visual scale
- Refined inverse-thumb presentation in `VfSwitch` and `VfThemeSwitch`
- Reduced default `VfAlert` icon size for a calmer text-to-icon balance
- Simplified demo table content so `VfTable` examples use regular text instead of inline code styling

## 1.13.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- `VfThemeSwitch` now supports:
  - `variant="button"` alongside the default switch presentation
  - `static` as an explicit typed prop
  - `thumbContrast="auto" | "inverse"` as an explicit typed prop
- `VfSwitch` now supports `thumbContrast="auto" | "inverse"` for controlling thumb contrast independently from track behavior
- Expanded demo coverage for:
  - `VfThemeSwitch` switch, static, inverse-thumb, and button variants
  - `VfThemeSwitch` button sizes
  - `VfSwitch` inverse-thumb static presentation

### Changed

- Updated `@codemonster-ru/vueforge-icons` to `^1.1.1`
- Refined `VfThemeSwitch` behavior so visual state tracks resolved theme more predictably during theme changes
- Improved `VfSwitch` thumb theming with dedicated inverse-thumb tokens for better contrast tuning across light and dark themes
- Theme-change transitions are now handled more consistently across VueForge components by preventing color-transition interpolation during `vf-theme-transitioning`

## 1.12.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- Expanded theme-token coverage so styles can now be customized independently for:
  - form controls
  - navigation and menu components
  - overlays and surfaces
  - feedback and disclosure components
- Expanded demo coverage for form states, including:
  - disabled inputs and selection controls
  - disabled active states for `VfCheckbox`, `VfSwitch`, and `VfRadio`
  - invalid static-state coverage for `VfSwitch`

### Changed

- Refactored form, navigation, surface, overlay, and feedback styling to use component-specific tokens that still default to shared semantic tokens
- Updated `VfSwitch` API so `static` is now a dedicated boolean prop instead of a `variant`
- Refined `VfSwitch` state behavior across:
  - `static`
  - `invalid`
  - `disabled`
  - light and dark themes
- Disabled form states now preserve neutral border colors and rely on muted backgrounds for clearer blocked-state presentation

## 1.11.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- `VfAlert` now supports icon customization through:
  - `icon` prop
  - `hideIcon` prop
  - `icon` slot override

### Changed

- Updated `@codemonster-ru/vueforge-icons` to `^1.1.0`
- Refined `VfAlert` icon semantics and visuals:
  - tone-based default icons now use a more consistent circular icon set
  - warning alerts now use `alertCircle`
  - danger alerts now use `xCircle`
  - decorative icon rings were removed so custom icons render cleanly
- Expanded alert demo coverage for:
  - custom icon usage
  - text-first alerts without an icon

## 1.10.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- External-link indicators for leaf items with `target="_blank"` in:
  - `VfMenuBar`
  - `VfNavMenu`
- Expanded demo coverage for external links on:
  - top-level menu-bar items
  - nested menu-bar submenu items
  - nested nav-menu items

### Changed

- Refined navigation spacing and interaction polish across:
  - `VfMenuBar`
  - `VfNavMenu`
  - `VfTableOfContents`
  - `VfDropdown`
  - `VfSelect`
- Active and selected states no longer shift layout by increasing font weight in:
  - `VfMenuBar`
  - `VfNavMenu`
  - `VfDropdown`
  - `VfSelect`
- `VfMenuBar` top-level items are now more compact, and the `pills` variant now uses filled hover and active states on the top level to better match the rest of the navigation system
- `VfTableOfContents` `pills` variant now uses a denser item height and padding balance for a less button-like presentation

## 1.9.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- New `variant` support for docs and navigation components:
  - `VfNavMenu`: `default | pills`
  - `VfTableOfContents`: `default | pills`
  - `VfMenuBar`: `default | pills`
  - `VfDropdown`: `default | pills`
- Expanded theme-token coverage for:
  - `VfNavMenu`
  - `VfTableOfContents`
  - `VfMenuBar`
  - dropdown menu-item states

### Changed

- Navigation state semantics are now aligned across:
  - `VfNavMenu`
  - `VfTableOfContents`
  - `VfMenuBar`
  - `VfDropdown`
- `VfNavMenu` now uses a calmer default presentation:
  - tighter vertical rhythm
  - no filled hover or active background in `default`
  - pill-like styling moved into the `pills` variant
- `VfTableOfContents` now mirrors the same variant model as `VfNavMenu`:
  - compact text-first `default`
  - accent background states in `pills`
- `VfMenuBar` variants now separate top-level and submenu behavior:
  - top-level items stay text-first in both variants
  - submenu items gain filled hover and active states in `pills`
- `VfDropdown` can now opt into the same state-color semantics as the navigation system while keeping its overlay layout intact
- Demo coverage was reorganized and expanded for:
  - navigation variants
  - dropdown variants
  - form controls with separate cards per component
  - invalid `VfSelect` and `VfTextarea` examples

## 1.8.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- New navigation components:
  - `VfMenuBar`
  - `VfBreadcrumbs`
- New form component:
  - `VfSelect`
- New data-display component:
  - `VfTable`
- New docs-oriented primitives in the demo and navigation flow:
  - smoother `VfTableOfContents` anchor scrolling
  - initial hash handling for table-of-contents pages

### Changed

- VueForge typography is now body-first:
  - application `body` styles define the baseline font family and text rhythm
  - components inherit that baseline and size around it
  - control sizing is now driven by the shared typography scale
- Navigation and selection patterns were unified across:
  - `VfNavMenu`
  - `VfTableOfContents`
  - `VfMenuBar`
  - `VfSelect`
  - `VfDropdown`
- `VfTabs` was redesigned as an underline-style tabs component with:
  - animated active indicator
  - calmer hover and active states
  - improved reload behavior without first-render indicator flicker
- Theme switching and theme-mode persistence were refined:
  - no-flash initial theme setup in `index.html`
  - `VfThemeProvider` now resolves stored/system theme synchronously
  - `VfThemeSwitch` interaction was stabilized during theme changes
- Visual language was simplified and made more consistent across:
  - buttons and links
  - cards and panels
  - dropdown, popover, tooltip, dialog, and drawer surfaces
  - alerts, badges, tags, forms, and navigation states
- Demo was refocused into a utilitarian component test surface instead of a showcase layout
- Updated docs guidance for docs pages to prefer semantic HTML content with:
  - `VfTableOfContents`
  - `useTableOfContents()`

### Removed

- Removed typography primitives from `core`:
  - `VfHeading`
  - `VfText`
  - `VfProse`
- Removed bundled typography/content styling layer tied to those primitives

### Migration Notes

- `VfHeading`, `VfText`, and `VfProse` are no longer exported from `@codemonster-ru/vueforge-core`
- Typography usage now assumes semantic HTML and app-level/body typography as the default baseline
- Docs/content integrations should migrate away from `VfProse` and render long-form content with normal HTML markup
- Consumers relying on the old typography primitive exports should migrate before upgrading
- Updated dependency on `@codemonster-ru/vueforge-theme` to `^1.2.0`

## 1.7.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- New typography primitives:
  - `VfHeading`
  - `VfText`
  - `VfProse`
- New typography documentation:

### Changed

- Added a full typography token layer with:
  - base font scale
  - semantic text roles
  - semantic heading roles
- `VfTableOfContents` now works as part of a documented docs/content pattern together with:
  - `VfProse`
  - `useTableOfContents()`
- More components now use semantic typography roles, including:
  - buttons and links
  - inputs and textareas
  - tabs and accordion
  - dropdown and overlay content
  - badges, tags, alerts, cards, and panels
- Component customization is now more token-driven for:
  - switch and radio visuals
  - prose spacing and inline/code blocks
  - button hover treatments
- Token cleanup refined the typography scale further:
  - `headingFontSizeXl` now maps to the shared scale
  - `fontSize3xl` was added
  - legacy line-height aliases remain only as compatibility tokens
- Demo showcase now includes:
  - typography primitives
  - prose/content examples
  - table-of-contents integration with real scrollspy state

## 1.6.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- New page navigation component:
  - `VfTableOfContents`
- New scrollspy composable:
  - `useTableOfContents`

### Changed

- `VfTableOfContents` now has its own theme-token namespace while staying visually aligned with `VfNavMenu` by default
- Table of contents navigation was polished for:
  - indentation by level
  - active item styling
  - title sizing and spacing
- Navigation rhythm was refined further across `VfNavMenu` and `VfTableOfContents`
- Core demo now includes:
  - `VfTableOfContents`
  - deeper navigation examples for `VfNavMenu`

## 1.5.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- New convenience theme component:
  - `VfThemeSwitch`
- `VfSwitch` now supports a `#thumb` slot with the current `checked` state

### Changed

- `VfThemeSwitch` now uses built-in `sun` / `moon` thumb icons by default
- Core demo now includes:
  - `VfThemeSwitch`
  - `VfSwitch` thumb slot example with icon content
- Theme-switching patterns are easier to reuse across VueForge packages without introducing extra theme widget variants

## 1.4.0

Minor release for `@codemonster-ru/vueforge-core`.

### Changed

- Unified the theme story so plugin setup, theme mode, persistence, and system sync read as one theme system
- `VueForgeCore` is now the canonical plugin export name for `@codemonster-ru/vueforge-core`
- The Vue plugin can now provide theme-mode defaults:
  - `defaultTheme`
  - `themeStorageKey`
  - `themeAttribute`
- `VfThemeProvider` now reads plugin-level theme-mode defaults when its own props are omitted
- README and theme documentation were updated to reflect the new recommended theme setup flow

## 1.3.3

Patch release for `@codemonster-ru/vueforge-core`.

### Changed

- Refined the built-in token scale to use cleaner whole-pixel spacing and sizing steps
- Kept the stricter token rhythm visually aligned across the demo in both light and dark themes
- Finalized the generated theme CSS pipeline around `.generated/theme`

## 1.3.2

Patch release for `@codemonster-ru/vueforge-core`.

### Changed

- Moved generated theme CSS artifacts out of `src/styles` and into `.generated/theme`
- Centralized CSS artifact generation in a shared internal build helper used by Vite and Vitest
- Kept `tokens.css`, `theme.css`, and breakpoint CSS generation aligned across `dev`, `test`, and `build`
- Simplified the source tree by removing generated CSS files from versioned source directories

## 1.3.1

Patch release for `@codemonster-ru/vueforge-core`.

### Changed

- Updated `@codemonster-ru/vueforge-theme` dependency to `^1.1.0`
- Refreshed theme architecture documentation to reflect the split between the neutral theme engine and the built-in core preset
- Stabilized foundation contract tests against formatting-only CSS import changes

## 1.3.0

Minor release for `@codemonster-ru/vueforge-core`.

### Added

- Published shared theme engine dependency:
  - `@codemonster-ru/vueforge-theme`
- Dedicated engine runtime tests now live in the theme package

### Changed

- `vueforge-core` now consumes the published `@codemonster-ru/vueforge-theme` package instead of a local file dependency
- Theme runtime helpers and shared theme types continue to be exposed through `core` bridge APIs for backward-compatible consumption
- `defaultThemePreset` remains in `vueforge-core` as the built-in opinionated design language
- Development and release setup were aligned with the published theme package and refreshed dependency trees

## 1.2.0

Feature release for `@codemonster-ru/vueforge-core`.

### Added

- New navigation component:
  - `VfNavMenu`
- New selection controls:
  - `VfCheckbox`
  - `VfSwitch`
  - `VfRadio`
- Shared overlay teleport contract for:
  - `VfDialog`
  - `VfDrawer`
  - `VfDropdown`
  - `VfPopover`
  - `VfTooltip`
- New overlay API documentation
- New z-index theme tokens for overlay and floating layers
- New shared neutral theme engine package:
  - `@codemonster-ru/vueforge-theme`

### Changed

- Theme runtime helpers, mode helpers, motion tokens, and shared theme types now come from `@codemonster-ru/vueforge-theme`
- `defaultThemePreset` remains in `vueforge-core` as the package's built-in design language
- `VfDrawer` now has a stronger embedding contract for downstream shell/layout use cases:
  - `offsetTop`
  - `bodyPadding`
  - root attr/class/style forwarding
  - drawer radius CSS variables
- `VfNavMenu` now supports:
  - grouped navigation
  - leading icons
  - `single` and `multiple` expand modes
  - automatic compact styling for simple menu trees
- Demo showcase now includes richer navigation comparisons and selection control coverage
- Selection controls and navigation visuals were polished across light and dark themes

## 1.1.1

Patch release for `@codemonster-ru/vueforge-core`.

### Fixed

- Improved TypeScript consumer resolution for `@codemonster-ru/vueforge-core/foundation`
- Foundation and theme subpath exports now point directly at their stable declaration entry files
- Added `typesVersions` mappings for `foundation` and `theme` to make downstream `tsc` and `vue-tsc` resolution more reliable

## 1.1.0

Foundation-focused minor release for `@codemonster-ru/vueforge-core`.

### Added

- Stable foundation layer with:
  - `vfBreakpoints`
  - `toMinWidthQuery`
  - `toMaxWidthQuery`
  - `useBreakpoint`
  - `useBreakpoints`
  - `useBreakpointValue`
  - `useScrollLock`
- New subpath exports:
  - `@codemonster-ru/vueforge-core/foundation`
  - `@codemonster-ru/vueforge-core/theme`
  - `@codemonster-ru/vueforge-core/tokens.css`
  - `@codemonster-ru/vueforge-core/foundation.css`
- Foundation API documentation
- Foundation contract and responsive helper tests
- Breakpoint tokens in both TS and CSS layers

### Changed

- Breakpoints now come from a single canonical source and are synchronized into CSS tokens
- `VfDialog` now uses the shared `useScrollLock` foundation helper
- Package build now includes foundation and theme entry points for downstream packages

### Notes

- This release is intended to make `@codemonster-ru/vueforge-core` a cleaner dependency for `vueforge-layouts`
- Public UI and theme APIs remain compatible with `1.0.0`

## 1.0.0

First stable release of `@codemonster-ru/vueforge-core`.

### Added

- Foundation Vue 3 library setup with Vite, TypeScript, Vitest, and ESLint
- Core primitives:
  - `VfButton`
  - `VfIconButton`
  - `VfLink`
  - `VfCard`
  - `VfPanel`
  - `VfDivider`
  - `VfBadge`
  - `VfTag`
  - `VfAlert`
  - `VfInput`
  - `VfTextarea`
  - `VfTabs`
  - `VfAccordion`
  - `VfDialog`
  - `VfDropdown`
  - `VfTooltip`
  - `VfPopover`
- Theme mode support with `VfThemeProvider` and `useTheme()`
- Runtime theme preset system with:
  - `VueForge` plugin
  - `defaultThemePreset`
  - token overrides via `preset`, `extend`, `light`, `dark`, and `options`
- Overlay positioning through `@codemonster-ru/floater.js`
- Icon integration through `@codemonster-ru/vueforge-icons`
- Demo showcase page for local visual verification
- Visual baseline documentation
- Theme API documentation

### Notes

- Theme support is runtime-based and ships with one built-in default preset.
- The stable `1.0.0` scope intentionally keeps theme support inside `@codemonster-ru/vueforge-core`.
- Separate theme packages and a dedicated Vite theme plugin are out of scope for this release.
