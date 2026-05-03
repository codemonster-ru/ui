# Changelog

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
