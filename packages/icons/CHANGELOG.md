# Changelog

## 2.0.0

### Added

- Added an explicit CSS-free Node ESM condition and CommonJS declaration facade for SSR consumers.
- Added the owner-approved 30-icon outline reference set and its internal visual-review workspace.

### Changed

- Made the package `exports` map authoritative while preserving the documented browser, Node ESM,
  and CommonJS conditions.
- Kept browser ESM auto CSS and the explicit `style.css` export while making Node ESM and CommonJS
  imports DOM-free.
- Declared Vue 3.5 and Node.js 18 consumer requirements and made CSS side effects explicit.
- Disabled icon spin animation when reduced motion is requested.
- Redrew the approved reference icons on a 24-unit canvas with a canonical 2-unit stroke, round
  terminals, and round joins.
- Updated geometry for `arrowRight`, `arrowDown`, `chevronRight`, `chevronDown`, `check`, `xmark`,
  `plus`, `magnifyingGlass`, `gear`, `house`, `user`, `users`, `file`, `folder`, `calendar`, `bell`,
  `warning`, `infoCircle`, `lock`, `grid`, `chartBar`, `columns`, `mail`, `cloud`, `database`,
  `pencil`, `trash`, `download`, `upload`, and `message`; their public names are unchanged.
- Completed the approved directional pairs with `arrowLeft`, `arrowUp`, `chevronLeft`, `chevronUp`,
  `caretLeft`, `caretRight`, `caretUp`, and `caretDown`.
- Extended approved related families with `minus`, `userPlus`, `userMinus`, `userCheck`, `unlock`,
  `fileText`, and `folderOpen`.
- Added approved system-feedback outlines for `info`, `question`, `questionCircle`, `alertCircle`,
  `checkCircle`, `xCircle`, and `ban`.
- Added the approved visibility outlines `eye` and `eyeSlash`.
- Added the approved appearance family `sun`, `moon`, and `circleHalf`.
- Added the approved time family `clock` and `history`.
- Added the approved circular-motion family `refresh`, `rotateRight`, and `circleNotch`.
- Added the approved content-operations family `copy` and `clipboard`.
- Added the approved storage-container family `inbox` and `archive`.
- Added the approved long-directional family `arrowLeftLong`, `arrowRightLong`, `arrowUpLong`, and
  `arrowDownLong`.
- Added the approved turn-directional family `arrowTurnUpLeft`, `arrowTurnUpRight`,
  `arrowTurnRightUp`, and `arrowTurnLeftDown`.
- Added the approved session-action family `logIn` and `logOut`.
- Added the approved filtering-action family `filter` and `funnelX`.
- Added the approved infrastructure-storage family `server` and `hardDrive`.
- Added the approved developer-tools family `terminal` and `code`.
- Added the approved financial-object family `creditCard`, `wallet`, and `receipt`.
- Added the approved workplace-object family `building` and `briefcase`.
- Added the approved layout-action family `expand` and `collapse`.
- Added the approved data-control family `sliders` and `sort`.
- Added the approved navigation-link family `link` and `externalLink`.
- Added the approved menu-trigger family `bars` and `ellipsis`.
- Expanded `IconCatalogEntry.style` to `'solid' | 'outline'`; 95 approved migrated icons are
  `outline`, while 21 untouched legacy icons remain `solid`.

### Fixed

- Corrected the previous CommonJS/SSR path that depended on browser CSS injection and a global DOM.
- Ensured clean package builds generate ESM, CommonJS, Node ESM, CSS, and declaration artifacts.
- Declared the Sass compiler used by icon Vue sources instead of relying on a transitive build tool.

### Removed

- Removed the inert `style="solid"` prop from `VueIconify`; style remains catalog metadata and does
  not select runtime geometry.
- Removed the empty `dualStyleCoreIconNames` export and the obsolete regular-variant generator path.
- Removed the obsolete icon-generator variant argument.
- Removed legacy top-level resolver metadata.

### Breaking changes

- Remove the `style` prop from `VueIconify` usage, remove imports of `dualStyleCoreIconNames`, and
  use a resolver that honors package `exports`.
- Consumer code that exhaustively handles `IconCatalogEntry.style` must handle the new `outline`
  value. Snapshot tests may also change for the 38 redrawn icon names.

## 1.5.0

### Added

- Added optional contextual icon sizing through `--vf-icon-current-size` for icons without an explicit `size` prop.

### Changed

- Icons rendered inside size-aware controls, such as `VfButton`, now inherit the control icon scale by default while explicit `size` values remain unchanged.

## 1.4.0

### Changed

- Align icon default size with VueForge token scale by switching component defaults to `var(--vf-icon-size-md)`.
- Add explicit icon transform CSS variable defaults to stabilize offset/scale composition in wrapper styles.
- Update local showcase theme wiring to use VueForge theme attribute conventions and shared foundation token CSS.
- Refresh showcase styling to consume semantic `--vf-*` design tokens for typography, surfaces, spacing, and controls.
- Migrate icon CSS API to `vf-icon*` / `--vf-icon-*` only and remove legacy `vif*` aliases.
- Relax README autogeneration requirements in `generate-icons.mjs`: builds no longer fail when optional `generated-*` marker blocks are absent.

## 1.3.1

### Patch Changes

- Add long-direction arrow variants for all cardinal directions.
- Add `arrowLeftLong`, `arrowUpLong`, and `arrowDownLong`.
- Refine `arrowRightLong` tail length to the maximum without clipping while keeping the arrowhead unchanged.

## 1.3.0

### Minor Changes

- Add a new brand-icon layer and release readiness improvements.
  - Add brand icons: `github`, `telegram`, `vk`, `youtube`, `x`, `facebook`, and `instagram`.
  - Extend icon catalog metadata with optional `brand` information (`source`, `guidelines`, `license`, `isTrademark`).
  - Separate the local showcase into dedicated `Core Icons` and `Brand Icons` sections.
  - Update README with brand/trademark usage guidance.

## 1.2.0

### Minor Changes

- Add the new `arrowTurnUpLeft` icon and include it in showcase previews.
- Refine showcase optical inset tuning so directional arrows render with more consistent visual weight.

## 1.1.1

### Patch Changes

- Refine the `sun` icon to better match the intended rounded ray silhouette and align its visual weight with the rest of the set.

## 1.1.0

### Minor Changes

- Add dark theme support and a lightweight theme switcher to the local showcase.
- Simplify the showcase into a focused internal icon preview with alphabetical ordering and optical inset tuning.
- Add new `info-circle` and `question-circle` icons.
- Normalize visual sizing and centering across the icon pack, including circle/status/object/user groups.
- Add reusable icon centering audit tooling and library-level optical offset support.
- Refine several existing icons, including `globe`, `moon`, and the circle family.
- Modernize TypeScript configuration to avoid deprecated compiler options in newer TypeScript versions.

## 1.0.1

### Patch Changes

- Publish the `1.0.1` package version update and lockfile refresh.

## 1.0.0

### Major Changes

- Release `1.0.0` with a redesigned solid icon pack and stabilized API.
  - redesign and expand the solid icon set with consistent geometry
  - remove regular icon variants and simplify the package to solid-only rendering
  - refine the showcase UI for focused icon review
  - stabilize build, typecheck, lint, and smoke verification workflow
