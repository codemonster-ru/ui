# Changelog

## Unreleased

### Added

- Added the `classic` and `duotone` icon families together with the public `family`,
  `secondaryColor`, and `secondaryOpacity` props.
- Added the `iconFamilies` and `IconFamily` exports for typed family selection.

### Changed

- Removed the completed Batch 2–29 migration review screens from the internal showcase while
  retaining their historical source data and documentation.
- Removed the completed reference, stroke-comparison, and blind-voting screens from the showcase;
  the showcase now focuses exclusively on the current `Variants` comparison.
- Split the Classic and Duotone showcase tables into accessible VueForge `VfTabs` panels.
- Added primary and secondary color regions to Duotone across Solid, Regular, Light, and Thin while
  keeping the Classic family unchanged.

### Compatibility

- Existing calls continue to use the visually unchanged `classic` family by default.
- Brand marks remain `classic`-only so their official geometry is not altered.

## 3.1.0

### Added

- Added `solid`, `regular`, `light`, and `thin` runtime variants for all 109 VueForge system icons.
- Added the public `variant` prop together with `iconVariants`, `outlineIconVariants`,
  `IconVariant`, and `OutlineIconVariant` exports.
- Added independently authored solid geometry derived from each icon's recognizable regular
  anatomy rather than restored legacy artwork.
- Added deterministic visual reference sheets for every system icon at 16, 20, and 24 px across all
  four variants.
- Added solid-geometry and consumer-bundle audits to the package verification workflow.

### Changed

- Made `IconCatalogEntry.variants` the authoritative declaration of supported runtime variants.
- Retained `IconCatalogEntry.style` as deprecated 3.x compatibility metadata; existing consumers
  continue to receive `outline` for system icons and `solid` for brand marks.
- Applied the same optical offsets to every variant so related weights remain aligned.
- Improved metadata-only tree-shaking and added explicit gzip budgets for lightweight metadata and
  the complete dynamic `VueIconify` renderer.
- Refined solid silhouettes, negative details, corner treatment, spacing, and family consistency
  against the approved regular geometry.

### Fixed

- Kept regular and long arrows visually distinct and normalized related directional families.
- Preserved recognizable anatomy in solid document, folder, storage, status, visibility, user,
  developer-tool, and spatial icon families.

### Compatibility

- Existing `VueIconify` calls continue to render `regular` system icons by default.
- Brand marks continue to render their preserved `solid` geometry by default.
- No icon names or package entry points were removed.

## 3.0.0

### Added

- Added the owner-approved 30-icon outline reference set and its internal visual-review workspace.

### Changed

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
- Added the approved favorite-marker family `bookmark`, `heart`, and `star`.
- Added the approved security-access family `shield` and `key`.
- Added the approved communication-action family `share`, `send`, and `phone`.
- Added the approved system-hardware family `cpu` and `plug`.
- Added the approved dynamic-signal family `activity` and `sparkles`.
- Added the approved spatial-structure family `globe` and `layers`.
- Completed the brand-preservation review for `github`, `telegram`, `vk`, `x`, `youtube`,
  `facebook`, and `instagram` without altering their trademark geometry.
- Expanded `IconCatalogEntry.style` to `'solid' | 'outline'`; 109 approved migrated icons are
  `outline`, while 7 independent brand marks remain `solid`.

### Breaking changes

- Consumer code that exhaustively handles `IconCatalogEntry.style` must handle the new `outline`
  value. Rendered geometry and snapshots change for the 109 non-brand icon names; public icon names
  are unchanged.

## 2.0.0

### Added

- Added an explicit CSS-free Node ESM condition and CommonJS declaration facade for SSR consumers.

### Changed

- Made the package `exports` map authoritative while preserving the documented browser, Node ESM,
  and CommonJS conditions.
- Kept browser ESM auto CSS and the explicit `style.css` export while making Node ESM and CommonJS
  imports DOM-free.
- Declared Vue 3.5 and Node.js 18 consumer requirements and made CSS side effects explicit.
- Disabled icon spin animation when reduced motion is requested.

### Fixed

- Corrected the previous CommonJS/SSR path that depended on browser CSS injection and a global DOM.
- Ensured clean package builds generate ESM, CommonJS, Node ESM, CSS, and declaration artifacts.
- Declared the Sass compiler used by icon Vue sources instead of relying on a transitive build tool.

### Removed

- Removed the inert `style="solid"` prop from `VueIconify`; the catalog remains solid-only.
- Removed the empty `dualStyleCoreIconNames` export and the obsolete regular-variant generator path.
- Removed the obsolete icon-generator variant argument.
- Removed legacy top-level resolver metadata.

### Breaking changes

- Remove the `style` prop from `VueIconify` usage, remove imports of `dualStyleCoreIconNames`, and
  use a resolver that honors package `exports`.

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
