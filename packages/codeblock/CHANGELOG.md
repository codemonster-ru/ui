# Changelog

## 2.3.0

### Changed

- Rebased default CodeBlock visual tokens onto VueForge core variables (`--vf-*`) for tighter design-system alignment out of the box.
- Updated dark-mode defaults to follow core semantic surface/text/border tokens instead of package-local fallback palette values.
- Added explicit line-number width token wiring and normalized spacing, typography, radius, and motion defaults through shared tokens.
- Updated runtime-theme examples/tests and README snippets to recommend token-driven overrides via core variables.
- Renamed the public component export/registration to `VfCodeBlock` and removed legacy `CodeBlock` / `VueCodeBlock` aliases.
- Migrated the component CSS API from `vcb*` / `--vcb-*` to `vf-codeblock*` / `--vf-codeblock-*` and switched runtime style tag id to `vf-codeblock-runtime-theme-vars`.

## 2.2.0

### Added

- Icon-based copy control using `@codemonster-ru/vueforge-icons` with semantic `aria-label`/`title` states (`Copy`/`Copied`)
- Regression test coverage for copy action availability when the header is hidden

### Changed

- Reworked line-number layout for more stable alignment in long code blocks and large line counts
- Moved copy action overlay to a dedicated code-shell layer so it stays visible while scrolling code content
- Added default max-height behavior for code content (`--vcb-max-height`) with per-instance override support via `maxHeight`
- Tokenized additional UI details for the copy control (offsets, opacity states, transition timing, icon sizing, hover color)
- Improved demo coverage with a dedicated 1000-line snippet and bounded-height long-content scenario
- Aligned header padding with code area padding for cleaner vertical rhythm

### Fixed

- Removed `<pre>` whitespace artifacts around the overlay copy control
- Ensured Vitest handles `@codemonster-ru/vueforge-icons` CSS side-effects via inline dependency configuration

## 2.1.0

### Added

- Runtime theme configuration API for plugin install via `themeVars`, `themeScope`, and `styleNonce`
- Public `setCodeBlockThemeVars(...)` helper for dynamic runtime token updates
- Plugin-level tests for scoped token injection, CSP nonce support, and SSR-safe runtime behavior

### Changed

- Simplified demo showcase to a minimal visual verification surface with theme switch and full language coverage
- Reworked default styling tokens to be self-contained (`--vcb-*`) while keeping VueForge-like defaults
- Tightened default line-number column behavior for more compact short snippets

### Removed

- Removed `playground` mode and all related props/types/tests from `vue-codeblock`

## 2.0.1

### Added

- Configurable root block spacing via `--vcb-margin-block`, `--vcb-margin-block-start`, and `--vcb-margin-block-end`
- Regression test coverage ensuring margin spacing variables are present on the root `.vcb` styling contract

### Changed

- Applied default external block spacing to `.vcb` so `CodeBlock` behaves like standard prose content in documentation layouts
- Prevented extra top/bottom spacing when `CodeBlock` is first or last child via `:first-child` and `:last-child` margin resets
- Updated README style API documentation with the new spacing custom properties and defaults

## 2.0.0

### Added

- Shiki-powered syntax highlighting for JavaScript, TypeScript, Vue, HTML, JSON, Bash, CSS, SCSS, and Sass
- Server-side rendering support for highlighted code via Vue `onServerPrefetch`
- Exhaustive local demo samples for every supported language value
- Regression coverage for Shiki highlighting, language aliases, and SSR output

### Changed

- Replaced the built-in regex highlighter with a fine-grained Shiki bundle that only includes supported languages and the `github-light` / `github-dark` themes
- Made exported highlighter helpers asynchronous: `highlightCodeBlock` and `highlightCodeLine` now return promises
- Render `plaintext`, `text`, and `txt` as escaped plain text
- Render plain escaped code immediately on the client while Shiki loads, reducing first-render flicker
- Lazily load Shiki language grammars on demand
- Updated package documentation for Shiki, async runtime helpers, supported languages, SSR behavior, and theme behavior

### Removed

- Removed the legacy regex token CSS classes and token color custom properties such as `--vcb-token-keyword-color`

## 1.1.2

### Fixed

- Reset internal `pre` border and radius styles so `CodeBlock` remains stable inside external prose containers

## 1.1.1

### Changed

- Refined the default surface styling so `CodeBlock` reads more like a documentation block and less like a heavy standalone widget
- Expanded the theming docs with the new surface-related CSS custom properties and default styling notes
- Refreshed the demo to better reflect VueForge-aligned default tokens and presentation

## 1.1.0

### Added

- Support for inherited theme detection from the nearest `data-vf-theme` ancestor when `theme="inherit"` is used
- Test coverage for inherited theme resolution via `data-theme`, `data-vf-theme`, fallback light mode, and explicit `light` / `dark` modes

### Changed

- Kept inherited theme priority as nearest `data-theme`, then nearest `data-vf-theme`, then fallback `light`
- Updated the built-in default light and dark code block palette to better match the current VueForge visual language
- Mapped default `CodeBlock` CSS variables to available `--vf-*` theme tokens with local fallbacks so the component stays fully standalone outside VueForge
- Documented `theme="inherit"` support for both `data-theme` and `data-vf-theme`

## 1.0.0

### Added

- Initial stable release of `@codemonster-ru/vueforge-codeblock`
- Vue 3 code block component with copy action, line numbers, theming, and syntax highlighting
- Shared runtime exports for `highlightCodeBlock`, `highlightCodeLine`, and `escapeCodeHtml`
- GitHub Actions CI workflow for install, typecheck, test, and build
- GitHub Actions publish workflow for npm releases triggered by `v*` tags

### Changed

- Finalized public package metadata and exports for npm publishing
- Cleaned published type artifacts so demo declarations are no longer included in the package
