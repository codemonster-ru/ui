# Changelog

All notable changes to this package will be documented in this file.

## Unreleased

### Added

- A `prefers-color-scheme: dark` block, guarded as `:root:not([data-cm-theme='light'])`, so the
  `system` theme resolves with no JavaScript at all. Previously the attribute was the only selector,
  which meant the most commonly chosen setting worked only once a script had run.

  Matching _not light_ rather than _no attribute_ lets a root stamped `system` resolve through the
  media query, so a server can render an unresolved preference verbatim instead of guessing which
  way it resolves in a browser it cannot see.

  The dark declarations are emitted twice as a result: 18,763 to 24,759 raw bytes, and 2,620 to
  3,049 gzipped.

## 1.0.1

### Changed

- Points repository, issue tracker, and homepage metadata at the dedicated CodeMonster UI
  repository.

## 1.0.0

### Added

- Promotes the registry-validated token and theme contract from `1.0.0-rc.1` without API changes.

## 1.0.0-rc.1

### Added

- Exposes the complete framework-independent token, theme, breakpoint, CSS, and serialization
  contracts for prerelease consumer validation.

## 0.1.0

### Added

- Added the initial framework-independent package scaffold, ESM entry, declarations, and package
  verification.
- Added the complete primitive color token names, strict public types, and immutable OKLCH palette.
- Added the complete light and dark semantic color role contracts using `--cm-*` primitive aliases.
- Added the framework-independent spacing scale and shared control and icon sizing tokens.
- Added framework-independent font family, weight, size, and line-height tokens.
- Added shared border widths, control/surface radii, and reusable surface and overlay shadows.
- Added shared motion durations, standard easing, numeric duration values, and a no-motion token.
- Added the typed breakpoint registry, CSS token values, and safe name lookup.
- Added the complete immutable light theme preset and composed theme token types.
- Added the complete immutable dark theme preset with mode-neutral foundation parity.
- Added generated `--cm-*` custom properties with light and dark theme selectors.
- Added a separate portable breakpoint CSS export without custom-media build requirements.
- Added immutable framework-independent serialization from theme tokens to `--cm-*` variables.
- Added the complete token group schema and generated CSS parity contracts.
- Documented CSS, theme, override, breakpoint, serialization, and server-rendering consumption.
