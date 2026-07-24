# VueForge — Phase 5: Documentation and Final GA Readiness

Prepared on: 2026-07-23. Audit scope: the public path from first opening the repository to a
production build, documentation for eight npm packages, component and theme contracts,
accessibility, SSR, Playground, migration path, and public release materials.

## 1. Executive Summary

Phase 5 assessed VueForge from the perspective of a developer who is unfamiliar with the repository
and uses only public packages and documentation. Before the fixes, the package/runtime verification
from Phase 4 already passed, but the documentation layer did not provide the same level of
assurance. The following objective defects were confirmed:

- the root README did not provide a reproducible path from installation to a theme, the first
  component, and a production build;
- the READMEs of the eight packages described requirements, package-manager commands, quick start,
  documentation, license, and coordinated release train versions inconsistently;
- Icons described installation only with npm and did not explain the explicit CSS/SSR contract;
- there was no single up-to-date guide for runtime theme configuration, scoped themes, custom
  prefix, fallback behavior, accessibility, and SSR/Vite/Nuxt;
- API tables for several components diverged from the actual props, emits, slots, and defaults;
- Button, Tag, DataTable, SkeletonGate, CodeBlock, and Playground examples contained outdated or
  incomplete calls;
- Playground documentation mixed sandbox/component modes and incompletely described renderer props,
  runtime exports, and theme inheritance;
- local links, anchors, package subpaths, install targets, and code examples had no common automated
  regression gate;
- the new documentation-example extractor did not confine `file=` and relative SFC import paths to
  its temporary fixture, making CI unsafe for untrusted Markdown from a pull request;
- the production showcase did not declare a favicon, so a clean browser profile received a
  `/favicon.ico` 404 and polluted the release smoke.

Fixes were made in the documentation, private root tooling, and shell production showcase.
CSS sources, design tokens, the palette, manifests of the eight published packages, and public
TypeScript shapes were not changed. The only runtime exception was a fix to the already-public
`componentSourceLanguage`, which was ignored for single-source and extensionless component files.
An automated contract audit was prepared for 296 Markdown files, 58 catalog component APIs, and
eight package READMEs, together with an actual `vue-tsc` run of 207 fixtures from complete/runnable
examples and verified public imports.

Final recommendation: the documentation and local release candidate are ready for a public stable
rollout. Publication was not performed. Hosted documentation deployment, registry-only smoke,
provenance, and manual platform/accessibility checks remain mandatory stop-the-line gates for the
release itself.

## 2. Documentation Audit

### README and the First User Journey

The root [README](../../README.md) now contains:

- the purpose of the ecosystem and minimum Vue/Node requirements;
- npm, pnpm, and Yarn commands for Core;
- complete browser setup with CSS and the Core plugin;
- `VfThemeProvider`, `VfThemeSwitch`, and the first component;
- the production build command;
- a table of all eight packages with coordinated versions;
- links to hosted documentation, the migration guide, release notes, and the MIT License.

The README of each published package has been aligned to a common minimum contract: purpose,
requirements, installation, quick start, documented public import, current coordinated version,
documentation, and license. Package-specific differences were preserved: CodeBlock and Playground
use explicit subpaths, Theme and Playground Core do not require Vue, the Vite plugin documents peer
Vite, and browser CSS is not attributed to CSS-free Node entries.

### Consistency and Regression Gates

Two release checks were added:

- `check:docs` checks the exact case of local links and images, anchors, the existence of VueForge
  packages/subpath exports, install targets, TS/JS/Vue snippet syntax, package README sections, and
  the correspondence of documented props/emits/slots to actual SFCs;
- `check:docs:examples` extracts complete SFCs, `playground-src`, runnable file examples, Quick Start
  TypeScript, and public imports, then checks them with the actual `vue-tsc` and built declarations.
  All generated paths go through a cross-platform containment check; separate regression tests
  reject `..`, absolute, backslash, and UNC escapes before writing a fixture.

Both checks are included in the main `check`/`verify`, so recurring drift blocks the release gate.
The existing ownership check confirms correct ownership of package imports. Markdown, JSON/YAML,
and whitespace are checked by the standard linters.

A one-time external HTTP audit confirmed the availability of the root hosted docs route and the
Core, Layouts, Icons, CodeBlock, and Playground sections, as well as the referenced official Vue,
Vite, Nuxt, and W3C references. Links to new local release documents will become available on
GitHub only after the release commit is pushed; npm package pages restrict automated HTML requests,
so registry state is checked by the release workflow through `npm view`, not scraping.

## 3. Installation Experience

The journey for a new Core consumer is reduced to three actions: install Vue/Core with the chosen
package manager, import `styles.css` in the browser entry, and install the Core plugin. Components
are imported explicitly, and the provider is added only where the application uses reactive theme
state.

The documentation consistently distinguishes:

- npm `install`, pnpm `add`, and Yarn `add`;
- the full stylesheet, component-entry auto CSS, and manual/granular CSS;
- the browser entry with CSS side effects and CSS-free Node/SSR conditions;
- Core/Layout root imports and mandatory `/view`, `/highlight`, `/ui`, `/runtime` subpaths;
- the Node 18 baseline and the Node 20 requirement for CodeBlock/Playground.

The Core, Layouts, CodeBlock, Icons, and Playground getting-started pages received explicit next
steps so that a user can proceed from installation to API, theme, accessibility, and SSR without
searching the source code. No new facade package, global component registration, or compatibility
layer was required.

## 4. Component Documentation

A source-derived inventory was created for 58 catalog/API-tab Vue components from Core, Layouts,
Icons, CodeBlock, and Playground. For each item in this inventory, the release gate requires an
existing API page and exact matching of the props, emits, and slots sets with the SFC contract.
Separate integration components are also documented on their canonical pages:
`VfThemeProvider` in Theme Configuration and `VfPlaygroundAsync` in Playground features; the generic
API-table gate does not apply to them.

Confirmed discrepancies were fixed, including Avatar, Breadcrumbs, Command Palette, Link, Select,
Switch, Table of Contents, Theme Switch, and Error Layout. The documentation now reflects the
actual optional/required props, events, scoped slots, and defaults. The Button, DataTable,
IconButton, Input, Link, Radio, Switch, Tag, and Theme Switch feature pages no longer promise
unsupported behavior, import undeclared transitive packages, or use outdated examples.

The CodeBlock API was supplemented with actual plugin/theme options, legacy constants, and
`/view`/`/highlight` exports. The Playground API separates sandbox and component discriminated
props and describes renderer contracts, the layout slot, runtime behavior, and available exports.
Complete SFCs, multi-file playground examples, and Quick Start/file-marked TypeScript are included
in the automated typecheck; short TS/JS/template fragments undergo syntax/compiler validation,
while their public imports are checked against built declarations.

## 5. Theme Documentation

A unified [Theme Configuration](../core/guides/theme-configuration.md) guide was created, describing
the current architecture without changing the system itself:

- primitive, semantic, VueForge 1.x component, and fallback layers;
- `extend`, mode-specific overrides, and complete custom presets;
- `VfThemeProvider`, `useTheme()`, and `VfThemeSwitch`;
- light, dark, and system resolution;
- nested/reversed scoped themes through `data-vf-theme`/`data-theme`;
- custom root, attribute, storage key, style id, and custom prefix with canonical `--vf-*` aliases;
- static CSS, no-JavaScript fallback, and runtime style injection;
- the boundary between Core integration and the low-level Theme engine.

The old theme API pages and visual-baseline links were synchronized with the canonical guide.
Examples use existing exports and actual option shapes. Palette values, token names, legacy
aliases, and runtime serialization were not changed.

## 6. Accessibility Documentation

An application-oriented [Accessibility](../core/guides/accessibility.md) guide was created.
It covers all requested areas:

- keyboard-only navigation and composite widget patterns;
- initial focus, focus trap, restoration, and visible focus indicators;
- ARIA roles, relationships, labels, and responsibility for custom slots;
- `prefers-reduced-motion` and the prohibition against reintroducing long consumer animations;
- `forced-colors` and the limits of browser emulation;
- RTL, logical geometry, and mixed-direction content;
- VoiceOver/NVDA/JAWS manual screen-reader scenarios;
- WCAG 2.2, contrast revalidation, and the absence of a blanket conformance claim.

Feature-page wording was adjusted where the previous text made a broader promise than the
implementation. Automated tests remain a regression signal, not a replacement for actual assistive
technology or Windows High Contrast verification.

## 7. SSR Documentation

An [SSR and Hydration](../core/guides/ssr.md) guide was created for Vue SSR, Vite SSR, and Nuxt.
It specifies:

- a fresh app factory for every request and identical server/client configuration;
- placing CSS in the client graph under CSS-free Node conditions;
- deterministic `VfThemeProvider` initial render and safe theme bootstrap;
- a Nuxt universal plugin and global CSS setup without a nonexistent Nuxt module;
- rules for custom runtime token CSS and a CSP nonce;
- hydration constraints, request-stable IDs, Teleports, and initial overlay state;
- SSR/lazy behavior for CodeBlock and Playground.

The documentation explicitly does not claim what has not been verified: the repository has no Nuxt
end-to-end fixture, hosted SSR deployment, or edge-runtime matrix. These checks were moved to the
remaining release risks.

## 8. Playground Audit

Playground Getting Started, API, features, theming, and guide index were reconciled with
`VfPlayground.vue`, public types, and runtime exports. Mode requirements, defaults, custom renderer
props, theme inheritance, and lazy runtime guidance were corrected. Multi-file `playground-src`
examples are now built as connected fixtures instead of being checked as isolated fragments.

Showcase navigation, theme switch, CodeBlock, and Playground routes pass the demo typecheck/build.
The large TypeScript compiler remains deferred and was not affected. The only runtime correction
in Phase 5 makes the existing `componentSourceLanguage` actually control single-source and
extensionless examples; regression tests cover both scenarios. Bundle architecture was not
changed.

Production Chromium smoke on a clean profile checked desktop/mobile and light/dark for Color
System, Core, CodeBlock, and Playground: 16 route/mode/viewport snapshots and eight CVD screenshots,
with no browser console errors or network failures. The check confirms a visible Playground content
surface, inherited theme, CodeBlock highlighting/focus, and the absence of horizontal overflow.
During this check, the missing showcase favicon was found and fixed; the repeated clean-profile run
passed completely. This is Chromium smoke, not a replacement for a multi-engine or
assistive-technology matrix.

## 9. Migration Guide Review

The historical release-train guide was replaced with the current
[VueForge 2 migration guide](../migration-to-v2.md). At the time of Phase 5, it was rechecked
against package manifests, exports, versions, and Phase 4 release notes and included:

- the complete coordinated version/floor matrix;
- joint updating of Vue and the Vue server renderer;
- supported CodeBlock/Playground subpaths;
- browser/Node CSS behavior;
- the Icons CommonJS correction;
- token compatibility and preserved aliases;
- a list of behavior corrections and post-upgrade checks.

No objective omissions were found after Phase 4, so the document was not changed merely to produce
a formal diff. Release notes received a link to copy-ready public release assets.

## 10. Release Assets

[Public release assets](../public-release-assets.md) was created with ready-to-use materials:

- a concise project description and feature list;
- exact npm descriptions from package manifests;
- a coordinated GitHub Release introduction;
- a release announcement to be published only after registry smoke;
- links to authoritative release notes, the migration guide, and package changelogs.

These materials do not replace package-specific CHANGELOG sections, which the release workflow uses
for scoped GitHub Releases. Publication, tags, GitHub Release, and announcement were not performed
in Phase 5.

### Final verification matrix

<!-- PHASE5_FINAL_VERIFICATION_START -->

| Command                           | Result                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| `npm test`                        | **PASS** — all workspace suites; Playground: 36 tests                       |
| `npm run verify`                  | **PASS** — full clean-install and release gate                              |
| `npm run typecheck`               | **PASS** — eight packages and showcase                                      |
| `npm run lint:all`                | **PASS** — source/styles/HTML/data and 296 Markdown files                   |
| `npm run build`                   | **PASS** — eight published packages                                         |
| `npm run build:demo`              | **PASS** — production showcase, 385 modules                                 |
| `npm run prepublish:all`          | **PASS** — build and dry-run pack of all eight packages                     |
| `npm run check:docs`              | **PASS** — 296 Markdown, 58 catalog API, 8 package README                   |
| `npm run check:docs:examples`     | **PASS** — 207 fixtures and 3 path-containment tests                        |
| `npm run check:package-contracts` | **PASS** — 8 publishable manifests and built exports                        |
| `npm run check:packed-consumers`  | **PASS** — npm 11.9.0, pnpm 10.34.5, and Yarn 1.22.22                       |
| `npm run audit:release`           | **PASS** — 0 production; one low dev-only `tsup`/`esbuild` finding accepted |
| `npm run visual:phase2`           | **PASS** — 16 snapshots, 8 CVD, 0 browser/network errors                    |
| `git diff --check`                | **PASS**                                                                    |

<!-- PHASE5_FINAL_VERIFICATION_END -->

## 11. Remaining Risks

No known local documentation/runtime defect that blocks the release candidate remains.
The following risks cannot be honestly resolved before publication or on a single macOS
workstation:

- npm Trusted Publishing, provenance, signatures, integrity, registry propagation, and dist-tags;
- fresh registry-only npm/pnpm/Yarn installation after all eight target versions become available;
- actual creation of GitHub Releases and availability of new repository-relative links after push;
- deployment and rendering of hosted documentation: the repository does not contain its
  generator/config;
- Nuxt end-to-end, streaming SSR, edge runtimes, and framework-specific Teleport integration;
- VoiceOver, NVDA, and JAWS speech/browse-mode behavior;
- native Windows High Contrast and platform focus rendering;
- Firefox/WebKit automation, the Windows/Linux browser matrix, and an actual 400% zoom/reflow pass;
- Yarn Berry Plug'n'Play and the full Vite 7/8 compatibility matrix, which are not part of the
  currently stated consumer certification;
- the deferred Playground TypeScript compiler remains approximately 3.61 MB minified / 1.03 MB gzip
  and is controlled by a budget, but is loaded when the sandbox starts;
- the accepted Phase 4 low dev-only advisory in `tsup`/`esbuild` remains outside the production
  package graph.

The release owner must perform topological publication and stop after the first failed registry
smoke. Hosted docs should be deployed from the same release commit before the announcement.
Platform/accessibility risks require manual recording of the results in the release issue; their
absence cannot be inferred from unit/DOM tests.

## 12. Final Recommendation

### Documentation Ready — yes

A new user gets a coherent path from installation → CSS → Core plugin → ThemeProvider → component →
production build. All package READMEs have the mandatory contract, component APIs are reconciled
with the source, local links/anchors and public imports are checked automatically, and runnable
examples compile and typecheck.

### Release Ready — yes

The documentation, migration path, release notes, announcement assets, and local tarball consumers
are aligned with the stable release train. Phase 5 changes do not expand the public API or change
CSS or the visual system; the runtime correction restores the declared behavior of an existing
prop. Before creating the next package tag, hosted-docs deployment and the sequential
registry/provenance checks from the release checklist are mandatory.

### Production Ready — yes for the release artifact within the stated support matrix

VueForge has a complete local release gate for tests, types, builds, package contracts, real
tarballs, npm/pnpm/Yarn consumers, SSR, tree shaking, deferred budgets, and documentation examples.
Therefore, there is no known engineering blocker for production use.

This status is not a promise for unverified platforms. The GA rollout is considered complete only
after successful publication of all eight packages, registry-only ecosystem smoke, documentation
deployment, and explicit acceptance of manual accessibility/browser risks. Until these external
steps are completed, the correct operational wording is **production-ready release candidate**,
ready for sequential GA publication.
