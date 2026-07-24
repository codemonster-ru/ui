# VueForge — Phase 4: publication, packaging, and distribution audit

Prepared on: 2026-07-23. Audit scope: eight publishable VueForge npm packages,
their dependency graph, package metadata, exports, tarballs, consumer scenarios, bundle delivery,
release automation, and upgrade documentation.

## 1. Executive summary

Phase 4 verified VueForge as an external consumer will see the library: not through workspace
aliases and monorepo sources, but through actual tarballs, a clean installation, and only the
declared package exports.

Before the fixes, local builds and tests did not guarantee a correct publication. The following
objective release defects were confirmed:

- some browser entrypoints with automatic CSS were also selected by direct Node ESM imports and
  were unsuitable for SSR without a CSS loader;
- the CommonJS runtime and its TypeScript declarations resolved through different module systems;
- published declarations contained extensionless relative imports, CSS side-effect imports, and
  references to local dependency shims;
- `main`, `module`, and `types` for CodeBlock and Playground conflicted with the intentionally absent
  modern root export and required an explicit legacy compatibility decision;
- Layouts built a full stylesheet but did not export it as `./styles.css`;
- internal dependency floors allowed packages predating Phase 0–3 that were incompatible with the
  current build to be installed;
- Shiki incorrectly remained a production dependency of CodeBlock even though the runtime uses
  already-built deferred chunks;
- package manager, engine, repository, and side-effect metadata were incomplete or inconsistent;
- the release workflow did not pin the npm toolchain or distinguish stable/prerelease dist-tags;
- the release toolchain retained vulnerable transitive patch versions and had no security gate for
  the production graph and high/critical development advisories;
- the lockfile allowed an invalid Vue companion graph: `vue@3.5.35` could receive deduplicated
  `@vue/compiler-dom`/`@vue/shared@3.5.33`, and the clean-install gate did not run `npm ls`;
- there was no single automated contract covering all manifests, exports, tarballs, TypeScript
  modes, SSR, and package-manager consumers.

After the fixes, all eight packages have a coordinated release train, valid export targets,
CSS-free Node paths, correct declaration conditions, and a reproducible publication sequence. Actual
tarballs were successfully installed and used by clean consumers with npm 11.9.0, pnpm 10.34.5, and
Yarn Classic 1.22.22.

Phase 4 did not change component markup, component CSS, public design tokens, palette values, or
visual behavior. The only runtime-source change localizes the public structural shape of the
`useFloating` types so Core declarations do not expose a third-party package's defective internal
specifiers to consumers; executable runtime code and valid placement/strategy values are unchanged.

The recommended status after this phase is **Ready for Stable Release** within the packaging and
distribution scope. Registry smoke, provenance/integrity, and stopping the train at the first failure
remain mandatory steps of the release process itself: they cannot be performed before the first
package appears in the registry, but a sequential gate and rollback plan are in place.

## 2. Package graph

The publishable graph consists of exactly eight packages:

```text
@codemonster-ru/vueforge-theme ───────────────┐
                                              ├──► vueforge-core ───► vueforge-layouts
@codemonster-ru/vueforge-icons ───────────────┘          │
             │                                           ├──► vueforge-playground
             └──► vueforge-codeblock ────────────────────┘             ▲
                                                                        │
@codemonster-ru/vueforge-playground-core ───────────────────────────────┘

@codemonster-ru/vueforge-playground-vite-plugin
  independent build-time integration; Vite is a peer
```

`vueforge-layouts` also depends directly on Theme, while Playground depends on Core, CodeBlock, and
Playground Core. There are no cyclic internal runtime/peer dependencies.

### Manifest consistency

| Package                | Export keys | Root JS                           | Module delivery | CSS delivery                                 | Node engine |
| ---------------------- | ----------: | --------------------------------- | --------------- | -------------------------------------------- | ----------- |
| Theme                  |           1 | Yes                               | ESM             | No dedicated CSS entry                       | `>=18`      |
| Icons                  |           2 | Yes                               | ESM + CJS       | Browser auto + `style.css`                   | `>=18`      |
| Core                   |          85 | Yes                               | ESM + root CJS  | Full, 38 component and 4 support CSS entries | `>=18`      |
| Layouts                |          40 | Yes                               | ESM + root CJS  | Full and 21 granular entries                 | `>=18`      |
| CodeBlock              |           6 | No, only `/view` and `/highlight` | ESM + CJS       | Auto `/view` + 4 explicit entries            | `>=20`      |
| Playground Core        |           1 | Yes                               | ESM             | None                                         | `>=18`      |
| Playground Vite Plugin |           1 | Yes                               | ESM             | None                                         | `>=18`      |
| Playground             |           6 | No, only `/ui` and `/runtime`     | ESM             | Auto `/ui` + 4 explicit entries              | `>=20`      |

For each package, `name`, `description`, `license`, `author`, `keywords`, `files`, `publishConfig`,
`repository`, `repository.directory`, `homepage`, `bugs`, `engines`, and the export map were checked.
All packages publish only `dist` and have `publishConfig.access: public`. README, LICENSE, and
`package.json` are added automatically by npm and are present in dry-run tarballs.

Funding metadata is absent from all packages. This is not a hidden inconsistency: the project has no
official funding URL, so adding a fictitious value would be worse than an intentional omission.
A separate `browser` field is unnecessary: browser bundlers receive `exports.import.default`, while
CSS-free SSR receives the higher-priority `exports.import.node` where the browser entry has a side
effect.

CodeBlock and Playground, at major versions 3 and 2 respectively, still do not declare a modern root
export: the supported API uses explicit subpaths. Their existing `main`/`module`/`types` are retained
for compatibility with older resolvers that ignore `exports` and point to actual artifacts. This
does not expand the modern package API or break legacy consumers in a minor release.

## 3. Dependency audit

### Runtime and peer edges

| Package                | Production dependencies                                      | Peer dependencies                     |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Theme                  | —                                                            | —                                     |
| Icons                  | —                                                            | Vue `^3.5.0`                          |
| Core                   | Floater `^1.0.8`, Theme `^1.4.0`, Icons `^1.6.0`             | Vue `^3.5.0`                          |
| Layouts                | Theme `^1.4.0`                                               | Core `^1.36.0`, Vue `^3.5.0`          |
| CodeBlock              | Icons `^1.6.0`                                               | Vue `^3.5.0`                          |
| Playground Core        | TypeScript `^5.8.2`                                          | —                                     |
| Playground Vite Plugin | —                                                            | Vite `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| Playground             | Core `^1.36.0`, CodeBlock `^3.7.0`, Playground Core `^1.2.0` | Vue `^3.5.0`                          |

`optionalDependencies` are not used. Vue remains a peer of Vue components so the consumer owns the
single application runtime. Core is a peer of Layouts because Layouts uses its public contracts but
must not install a second copy of the UI layer. Vite is a peer of the build-time plugin. TypeScript
intentionally remains a production dependency of Playground Core: the browser sandbox actually
loads the compiler runtime on demand.

Objective cleanup changes:

- `shiki` was moved from CodeBlock production dependencies to devDependencies along with direct
  `@shikijs/core` and `@shikijs/langs`: the library build already contains lazy chunks, and a clean
  consumer must not reinstall the source Shiki graph;
- Icons now explicitly declares the Sass compiler used by its Vue sources: previously, a clean build
  accidentally depended on another tool's transitive dev dependency;
- unused CodeBlock devDependencies on Core, Layouts, and Sass were removed;
- the actually used audit/build dependencies were added to Icons, Core, Layouts, Playground,
  Playground Core, and the Vite plugin;
- the root `vue-router` override, absent from the actual install graph, was removed;
- sibling packages in devDependencies still use explicit `file:../...`, while publishable
  runtime/peer edges use only SemVer ranges.

Root `markdownlint-cli2` was updated to 0.23.1; obsolete global overrides for `js-yaml@4.2.0` and
`markdown-it@14.2.0` were removed so dependencies receive supported patched versions. The lockfile
also upgraded vulnerable `brace-expansion`, `fast-uri`, and `linkify-it` within the declared ranges.
`npm audit --omit=dev` reports 0 vulnerabilities, and `npm audit --audit-level=high` passes. The full
audit leaves one accepted low dev-only advisory in `tsup → esbuild`; it is described under remaining
risks. Deprecated `glob@10.5.0` and `whatwg-encoding@3.1.1`, visible during a clean installation,
resolve only through test/dev tooling and are not included in any consumer tarball.

Vue companion resolution in the lockfile is aligned: runtime `vue@3.5.35` receives exact
compiler/shared 3.5.35 versions, while compatible 3.5.33 versions remain isolated within development
language-tooling branches. `npm ls --all` passes and now runs automatically immediately after the
temporary clean `npm ci`, so another invalid deduplication blocks `verify` before tests and builds.

The automated graph contract checks all internal edges across all three runtime fields, exact minimum
release-train versions, and the absence of cycles. The packed consumer additionally proves that each
installed package is outside the monorepo and that the production graph contains no Shiki.

## 4. Versioning

The previous versions in the left column are published on npm, and all packages received
publicly significant changes in Phase 0–3 or packaging corrections in Phase 4. A coordinated minor
release train was therefore prepared:

| Package                | Published version | Next version | Rationale                                                  |
| ---------------------- | ----------------: | -----------: | ---------------------------------------------------------- |
| Theme                  |           `1.3.0` |      `1.4.0` | Expanded theme/token contract and release metadata         |
| Icons                  |           `1.5.0` |      `1.6.0` | SSR-safe Node/CJS delivery and declaration contract        |
| Core                   |          `1.35.1` |     `1.36.0` | Phase 0–3 contracts, exports, and SSR package paths        |
| Layouts                |          `1.21.0` |     `1.22.0` | Corrected component types, full CSS export, and Node paths |
| CodeBlock              |           `3.6.1` |      `3.7.0` | SSR/deferred runtime and package dependency correction     |
| Playground Core        |           `1.1.1` |      `1.2.0` | Runtime hardening and additive contracts                   |
| Playground Vite Plugin |           `0.1.1` |      `0.2.0` | Additive typings/naming and package metadata               |
| Playground             |           `2.5.1` |      `2.6.0` | Runtime/UI hardening and explicit SSR paths                |

As of the audit date, all eight target versions are available in the npm registry. A major bump is
not required under the adopted compatibility policy: no documented modern export, prop, event, or
token was removed, and legacy root metadata for CodeBlock/Playground is retained. The new `engines`
record the existing toolchain and Shiki 4 floors (`>=20` for CodeBlock/Playground), rather than
removing a supported runtime. Vue `^3.5.0` records the actual coordinated-graph requirement. For the
pre-1.0 Vite plugin, the `0.1.1` → `0.2.0` transition was chosen explicitly; the additive change is
significant enough for a pre-stable minor.

Internal dependency floors point to the versions in this table. This prevents a new Playground or
Layouts from being installed with an older Core/Theme that lacks the required Phase 0–3 contracts.

Stable tags are published under the npm dist-tag `latest`; SemVer prerelease tags use `next`. This
behavior is enforced by dedicated tests for the release-preparation script.

## 5. Packaging

### Export architecture

Browser ESM component subpaths for Core/Layout, the Icons root, CodeBlock `/view`, and Playground
`/ui` retain automatic CSS loading. CSS-free `node` conditions were added for direct Node ESM
imports. CommonJS exists only for genuinely supported surfaces:

- Icons root;
- Core root, `/foundation`, `/theme`;
- Layouts root;
- CodeBlock `/view`, `/highlight`.

Each CJS runtime now has a `.d.cts` facade. ESM types remain `.d.ts`; `types` is located inside the
corresponding `import`/`require` branch before runtime conditions. Core and Layouts component
subpaths, CodeBlock `/view`, Playground `/ui`, and the Icons root select a CSS-free Node artifact
without changing the browser default.

Theme, Playground Core, and Playground Vite Plugin are intentionally ESM-only. Playground UI/runtime
does not declare CommonJS. Legacy Node 10 resolution is neither promised nor emulated by compatibility
wrappers.

The shared build finalizer makes generated declarations suitable for modern Node resolution:

- resolves a relative declaration target to a file or directory index;
- adds a runtime-safe `.js`/`index.js` specifier;
- removes meaningless CSS side-effect imports from `.d.ts`;
- fails the build if an unsafe specifier remains.

In a full build, 4 specifiers for Icons, 242 for Core, 65 for Layouts, 15 for CodeBlock, and 6 for
Playground were normalized; 3 CSS imports were removed from Playground declarations. The Core/Layout
build additionally excludes workspace dependency shims from the published declaration graph.

### Tarball inventory

| Package                      | Files | Packed bytes | Unpacked bytes |
| ---------------------------- | ----: | -----------: | -------------: |
| Theme 1.4.0                  |    27 |        9,267 |         38,374 |
| Icons 1.6.0                  |    19 |      130,960 |        587,402 |
| Core 1.36.0                  |   530 |      289,147 |      2,119,117 |
| Layouts 1.22.0               |   109 |       39,561 |        275,666 |
| CodeBlock 3.7.0              |    53 |      371,637 |      1,982,163 |
| Playground Core 1.2.0        |     5 |        7,864 |         25,277 |
| Playground Vite Plugin 0.2.0 |     5 |        3,043 |          8,623 |
| Playground 2.6.0             |    17 |       13,043 |         54,311 |

For each tarball, the presence of all targets from `exports`, `main`, `module`, `types`, and `style`
was confirmed; missing targets: 0. `files: ["dist"]` does not include tests, source aliases, or
workspace-only files.

In addition, all eight archives were created once outside the workspace and passed as exact `.tgz`
files to `npm publish <archive> --dry-run --ignore-scripts`; every dry-run passed. This locally
confirms the same immutable-artifact path used by the release workflow.

Publint finds no errors in any package. Two warnings record an intentional distinction: CodeBlock and
Playground retain legacy `main` but do not add a modern root export after major versions 3/2. Are The
Types Wrong passes for all JavaScript entrypoints in Node16 ESM and bundler modes, as well as for all
declared CJS branches. The remaining 296 `NoResolution` cells concern 74 CSS subpaths across four
TypeScript modes: the tool treats them as TypeScript imports even though the files physically exist
in the tarballs and are intended for CSS loaders. This is a tool limitation, not a missing export.

### Changed file groups

- package contracts: root `package.json`/lockfile and eight package manifests;
- generated artifact logic: Vite configs for Core, Layouts, Icons, and CodeBlock, plus the declaration
  finalizer;
- release gates: package-contract, packed-consumer, tree-shaking, deferred-runtime, and tag-preparation
  scripts/tests;
- automation: `.github/workflows/release-from-tag.yml`;
- user guidance: each package's README/CHANGELOG, installation guides, migration guide, release notes,
  and release checklist;
- one type-only source correction: `packages/core/src/composables/useFloating.ts`.

CSS and Vue component implementation files were not changed in Phase 4.

## 6. Consumer verification

The same scenario runs for npm, pnpm, and Yarn outside the workspace. The fixture is created in the
system temporary directory, builds eight actual `.tgz` files, installs only those files, and is
removed after verification. Until the new versions appear in the registry, pnpm overrides and Yarn
resolutions point transitive internal ranges to the same local tarballs; this models an atomically
available release train without replacing package contents with workspace links. npm and Yarn caches
are also isolated inside the fixture so a repeat run cannot retrieve an archive with the same
version/path from a previous build.

| Scenario        | Versions                                              | Result |
| --------------- | ----------------------------------------------------- | ------ |
| npm install     | npm 11.9.0                                            | PASS   |
| pnpm install    | pnpm 10.34.5, strict peers                            | PASS   |
| Yarn install    | Yarn Classic 1.22.22                                  | PASS   |
| Framework       | Vue + server renderer 3.5.35                          | PASS   |
| TypeScript      | 5.9.3, Bundler + NodeNext, `skipLibCheck: false`      | PASS   |
| Browser build   | Vite 6.4.3                                            | PASS   |
| Node ESM SSR    | All public JS ESM specifiers and all UI packages      | PASS   |
| CommonJS SSR    | All declared `require` branches without a DOM shim    | PASS   |
| Minimum engines | Node 18.20.8 and Node 20.x ESM/CJS entry smoke        | PASS   |
| CSS             | Representative auto CSS + all 74 explicit CSS exports | PASS   |
| Isolation       | No resolution into monorepo; graph versions are exact | PASS   |

The consumer imports only specifiers available through published `exports`. It separately verifies
direct CSS entries, browser auto-CSS, Node CSS-free entries, CodeBlock `/view`/`/highlight`,
Playground `/ui`/`/runtime`, the Vite plugin, and SSR rendering. No test uses a source alias or the
`dist` of another workspace package.

A full registry installation remains a post-publish gate: a local tarball can prove package contents
and resolution semantics, but not the npm dist-tag, registry replication, provenance, or integrity
metadata.

## 7. Tree shaking

The regression gate covers one component, multiple components, a namespace import, a granular
subpath, and CSS side effects.

| Import scenario                         | Minified JS raw |   JS gzip | Result                       |
| --------------------------------------- | --------------: | --------: | ---------------------------- |
| Core root → `VfButton`                  |        2.22 KiB |  1.01 KiB | PASS                         |
| Core `/button`                          |        2.00 KiB |  0.91 KiB | PASS, button CSS retained    |
| Core root → Button + Dialog + DataTable |       25.66 KiB |  8.56 KiB | PASS                         |
| Core full namespace                     |      201.44 KiB | 45.81 KiB | Expected full API            |
| Layouts root → `VfContainer`            |        0.91 KiB |  0.54 KiB | PASS                         |
| Layouts `/container`                    |        0.91 KiB |  0.54 KiB | PASS, container CSS retained |

In the packed consumer, an independent Vite build of one Core Button produced 2,769 bytes JS / 1,064
bytes gzip and 10.27 kB CSS / 1.78 kB gzip. Button CSS is retained, while Accordion CSS is absent.
Thus, precise `sideEffects` prevents the bundler from removing required styles without retaining
unrelated component styles.

Small imports are also checked for the absence of the OKLCH palette graph and theme application
runtime. Automatic CSS wrappers are marked side-effectful individually; Theme, Playground Core, and
Vite Plugin are marked `sideEffects: false`. The generic Icons renderer inherently includes the
dynamic-name catalog (about 24.18 KiB gzip); for a statically known icon, this is an intentional API
model, not a loss of tree shaking across the entire VueForge graph.

## 8. Bundle analysis

The Vite warning about a chunk larger than 500 kB is reproducible and isolated. Its source is the
TypeScript compiler that Playground Core loads for browser sandbox compilation:

- minified chunk: 3.61 MB;
- gzip: 1,009.52 KiB;
- about 99.6% of its contents belong to TypeScript;
- the chunk loads only after the sandbox session is activated;
- the initial application graph does not contain TypeScript, Playground runtime, or Shiki.

The warning is not masked by increasing the global `chunkSizeWarningLimit`, which would hide future
regressions in other chunks. Manually splitting compiler internals does not reduce the total download
and may increase request/parse overhead. There is no objective reason to change the runtime in Phase
4; instead, a separate deferred compiler budget of 1,100 KiB gzip and a check that the compiler is
absent from the static route graph were established.

The Showcase initial entry is 90.24 KiB gzip against a 95 KiB budget. Route chunks: Core 23.56 KiB,
Layouts 10.42 KiB, Icons 1.32 KiB, CodeBlock 2.00 KiB, and Playground 3.97 KiB gzip. The CodeBlock
route does not include Shiki statically; total Shiki-related deferred chunks are about 174.81 KiB
gzip.

Conclusion: the large compiler chunk affects download/parse only when Playground starts, does not
increase the base VueForge runtime, and does not indicate broken tree shaking. Its size should remain
observable under a separate budget rather than blocking Core/Layout consumers.

## 9. Installation UX

The READMEs for all eight packages and the primary installation guides now describe the same
contract:

- package-specific Node requirements and Vue/Vite peer requirements;
- npm, pnpm, and Yarn commands;
- full and granular import paths;
- browser auto-CSS, explicit full CSS, and CSS-free Node conditions;
- placement of SSR CSS imports in the client entry;
- CodeBlock `/view` and `/highlight` instead of a nonexistent root import;
- Playground `/ui`, `/runtime`, component mode, and lazy sandbox behavior;
- Theme runtime usage and Vite virtual modules.

For a typical Core consumer, only installing Vue/Core and choosing one CSS strategy are required.
Layouts can use the single new `@codemonster-ru/vueforge-layouts/styles.css` instead of knowing an
internal dist path. CodeBlock and Playground explicitly separate UI and runtime, so a server build
does not have to infer the browser entry.

The simplification required no new facade package, global setup, or fallback API. Modern resolvers
unambiguously use documented CodeBlock/Playground subpaths, while the former `main`/`module`/`types`
are retained only for legacy resolvers. Documented imports are identical in Vite, TypeScript, and
Node.

## 10. Migration

The historical release-train guide was replaced with the current
[VueForge 2 migration guide](../migration-to-v2.md). At Phase 4, its scope included:

- a table of all versions, Node/Vue/Vite requirements, and internal floors;
- a command for coordinated package upgrades;
- the requirement to upgrade Vue and `@vue/server-renderer` together to 3.5;
- explicit CodeBlock and Playground subpaths;
- browser/SSR CSS rules;
- the Icons CommonJS correction and explicit client CSS;
- token-name compatibility and retained legacy aliases;
- a list of corrected behavior contracts that applications should recheck.

The document does not present the packaging correction as a fictitious redesign. Public token names
were not renamed, public component exports were not removed, and Phase 4 does not change OKLCH
values. Accidental malformed CSS custom-property spellings from the old serializer are not promised
as API; canonical token names and legacy aliases established after Phase 0 remain.

Release notes and package CHANGELOGs separate breaking changes, compatibility requirements, new
features, and fixes. The only mandatory migration actions are to observe Vue/Node floors, use the
already documented CodeBlock/Playground subpaths, and import CSS on the client side for Node/CJS
scenarios.

## 11. Release checklist

The canonical [release checklist](../release-checklist.md) covers:

1. selecting `latest` or `next`;
2. a clean release commit and matching package/tag/changelog versions;
3. the complete repository verification sequence;
4. a dry-run, creation, and manual inspection of each tarball;
5. repeat clean consumers for npm/pnpm/Yarn;
6. sequential publication in topological order;
7. post-publish registry, provenance, integrity, and signature smoke;
8. rollback through dist-tag/deprecation and a forward patch;
9. final verification of all eight registry packages.

Publication order:

1. Theme 1.4.0;
2. Icons 1.6.0;
3. Playground Core 1.2.0;
4. Playground Vite Plugin 0.2.0;
5. Core 1.36.0;
6. CodeBlock 3.7.0;
7. Layouts 1.22.0;
8. Playground 2.6.0.

The GitHub workflow accepts only a scoped tag in the `@scope/package@x.y.z` format, verifies the
package version and a nonempty matching CHANGELOG section, runs the full `verify` with all three
package managers, creates the target `.tgz` once, inspects it through a publish dry-run, and publishes
that exact same file with `--provenance`, explicit access, and the computed dist-tag. A repeated
lifecycle rebuild between inspection and publication is excluded. A prerelease version also marks
the GitHub Release as a prerelease. Node 24 and npm 11.9.0 are pinned; workflow actions use Node 24
majors. Global concurrency prevents two package publications from running simultaneously.

Rollback does not use unpublish as the primary path: the train is stopped, `latest`/`next` is moved
back to a known working version, the defective version is deprecated, and a forward patch is
released.

### Final verification matrix

<!-- PHASE4_FINAL_VERIFICATION_START -->

| Command                           | Status                                                      |
| --------------------------------- | ----------------------------------------------------------- |
| `npm test`                        | PASS                                                        |
| `npm run audit:release`           | PASS — production 0; high/critical tooling 0; one low noted |
| `npm run verify`                  | PASS — clean install and complete release gate              |
| `npm run typecheck`               | PASS                                                        |
| `npm run lint:all`                | PASS — 291 Markdown files                                   |
| `npm run build`                   | PASS — all eight packages                                   |
| `npm run build:demo`              | PASS                                                        |
| `npm run prepublish:all`          | PASS — eight package dry-runs                               |
| `npm run check:package-contracts` | PASS — eight manifests and built exports                    |
| `npm run check:packed-consumers`  | PASS — final npm/pnpm/Yarn repeat                           |
| `git diff --check`                | PASS                                                        |

<!-- PHASE4_FINAL_VERIFICATION_END -->

## 12. Remaining risks

No known package-content or export-resolution defect blocking beta remains. The following risks
cannot be properly closed by local prepublication verification:

- the new versions do not yet exist on npm, so dist-tags, registry replication, provenance,
  integrity, signatures, and registry-only transitive resolution are verified after each package is
  published;
- npm Trusted Publisher and ownership of each scoped package are external registry configuration;
  the release owner must confirm the binding specifically to `.github/workflows/release-from-tag.yml`;
- Yarn was verified in supported Classic 1.22 mode; Yarn Berry Plug'n'Play is not declared as a
  separate compatibility target and requires separate certification if the project decides to
  promise it;
- the packed browser consumer was verified on Vite 6.4.3; the declared peer range also allows Vite
  7/8, which remain a separate compatibility matrix for subsequent certification;
- the latest `tsup@8.5.1` resolves `esbuild@0.27.7`, which has one registered low advisory concerning
  the Windows development server. In VueForge, this dependency is used only by the build command and
  is absent from the production package graph; a forced move to `esbuild@0.28.1` was not made because
  it is outside the declared `tsup` range. The security gate blocks all production and high/critical
  tooling advisories, and this pin should be removed through a regular `tsup` update;
- the final local run uses Node 24/macOS, while CI uses Node 24/Linux; the declared minimum Node 18/20
  entrypoints passed a separate runtime smoke, but one workstation run does not replace a complete
  cross-platform test matrix;
- Are The Types Wrong does not model CSS loaders and therefore continues to show the expected CSS
  `NoResolution`; JS/types resolution is green;
- intentional ESM-only packages and component subpaths do not receive an artificial CommonJS facade;
  consumers must follow the exports matrix;
- the Playground TypeScript compiler remains a large deferred payload and requires monitoring under
  a separate budget;
- Phase 3 platform risks—Firefox/WebKit, Windows High Contrast, native zoom, and actual assistive
  technologies—are not closed by a package audit;
- hosted documentation must be deployed with this release train; local docs alone do not update the
  already published site.

Operational mitigation for the prepared stable train: publish strictly one package at a time in
topological order, run registry smoke after each step, and stop the train immediately on error. If
the team separately decides to run a canary, the same workflow supports a SemVer prerelease under
`next`, but the versions prepared in manifests/changelogs are stable and intended for `latest`.

## 13. Overall release readiness

### Ready for Internal Release — yes

All package contracts, builds, tests, packed installs, SSR paths, types, and tarball contents are
verified automatically. The internal release has no known blockers; the package graph and rollback
procedure are unambiguous.

### Ready for Public Beta — yes

A public beta can optionally be published under `next`: npm/pnpm/Yarn consumers pass with actual
tarballs, documentation and the migration path are ready, the large payload is isolated, and public
component/token contracts were not removed. This is an available additional stage, but not a
required conclusion of the audit.

### Ready for Stable Release — yes, recommended final status

The prepared train uses stable SemVer versions and has no known local release blocker. Exact tarball
publication, cross-manager packed consumers, SSR/type resolution, dependency floors, package
contracts, and changelog extraction are automated; migration and rollback are documented in detail.
Therefore, from the Phase 4 perspective, the system is ready for a stable release.

The following stop-the-line gates are mandatory during publication:

1. all eight packages are published sequentially and receive provenance/integrity;
2. the full consumer is repeated using registry versions only;
3. npm dist-tags and internal dependency resolution are confirmed;
4. no further tags are created after the first installation/SSR regression;
5. hosted documentation is deployed, and the remaining platform risks are explicitly accepted by
   the release owner.

These checks are part of the stable rollout, not grounds for publishing the already prepared stable
versions as beta. Final Phase 4 assessment: **Ready for Stable Release**.
