# VueForge Repository Hygiene Report

Date: 2026-07-24

Audited baseline: `febae3f` (`Finalize VueForge 2 compatibility cleanup`)

## 1. Executive Summary

The final hygiene audit examined all 885 files tracked at the baseline, all nine workspaces, all eight
publishable package contracts, and the repository's documentation, test, build, CI, release, migration,
and tarball paths.

Three tracked files were proven obsolete and removed:

- one unreachable Layouts barrel;
- one unused Icons ambient declaration;
- one orphan Layouts TypeScript configuration.

Associated dead configuration was removed without changing a runtime entry, package export, CSS entry,
public type, component, migration path, release workflow, or dependency. Six empty local source
directories and one ignored build-info artifact were also removed; Git does not represent those local
empty directories in the commit tree.

No scripts, tests, fixtures, snapshots, release documents, migration files, or image assets met the
deletion threshold.

## 2. Audit Scope

The audit used `git ls-files`, `git status --short`, and `git status --ignored --short` as the canonical
repository inventory. It traced:

- workspace dependencies and all manifest `exports`, `files`, scripts, and side-effect declarations;
- TypeScript, Vue, JavaScript, CSS, JSON, dynamic-import, alias, and `import.meta.glob` reachability;
- Vite, Vitest, TypeScript, ESLint, Stylelint, HTMLHint, Markdownlint, Prettier, npm, and editor configs;
- root, workspace, hook, CI, release, prepack, migration, documentation, and visual script callers;
- conventional and explicit test discovery, mocks, setup files, consumers, fixtures, and snapshots;
- documentation links, component-document contracts, examples, images, and historical design records;
- build outputs, declarations, CJS/ESM/SSR paths, CSS entries, tree shaking, and npm pack contents;
- npm, pnpm, and Yarn packed-consumer paths.

`node_modules`, ignored build outputs, caches, and Git internals were excluded from source analysis.

## 3. Repository Inventory

### Baseline

| Measure | Count |
| --- | ---: |
| Git-tracked files | 885 |
| Tracked directory paths | 202 |
| Markdown files | 297 |
| TypeScript/MTS files | 217 |
| Vue files | 187 |
| CSS files | 79 |
| JSON/JSONC files | 36 |
| Tracked script files | 34 |
| Test/config/support files, including the CI test harness | 44 |
| Tracked fixtures | 0 |
| Tracked snapshots | 0 |
| Tracked image assets | 3 |
| Tracked working-tree bytes | 3,658,275 |

The top-level distribution was 549 files under `packages/`, 271 under `docs/`, 25 under `examples/`,
17 under `scripts/`, 3 under `.vscode/`, 2 under `.github/`, and 18 other root/hook/config files.

### Workspace graph

| Workspace | Kind | Internal dependencies |
| --- | --- | --- |
| Theme | publishable | none |
| Icons | publishable | none |
| Core | publishable | Theme, Icons |
| Layouts | publishable | Theme, Core, Icons |
| CodeBlock | publishable | Icons |
| Playground Core | publishable | none |
| Playground | publishable | Playground Core, CodeBlock, Core |
| Playground Vite Plugin | publishable | none |
| Playground example | private | CodeBlock, Playground, Vite Plugin, Core, Icons, Layouts |

The internal runtime graph is acyclic. Root `build` and `prepublish:all` cover every publishable
workspace. CI runs `npm ci`, `npm run verify`, and `npm run prepublish:all`; the tag workflow resolves
one package, re-runs verification, packs it, performs a publish dry run, publishes it, and creates its
release.

## 4. Deleted Files

| Path | Previous purpose | Evidence for deletion | Safety evidence |
| --- | --- | --- | --- |
| `packages/layouts/src/theme/index.ts` | Layouts theme barrel | Duplicated the runtime exports in canonical `theme/public.ts` and had no incoming source, config, test, documentation, build-entry, or export reference | `src/index.ts` and the plugin use `theme/public.ts`; package exports do not expose the old barrel; its only pack effect was an unexported declaration |
| `packages/icons/index.d.ts` | Declared global `__APP_VERSION__` | No tracked source reads the identifier; only the Icons tsconfig included the declaration | The file was not emitted or packed; both Vite defines targeting the absent identifier were removed with it |
| `packages/layouts/tsconfig.node.json` | Auxiliary Node/build TypeScript configuration | Its only project reference was removed in commit `161db4f`; no script, workflow, config, or editor task calls it | It was not published; its ignored build-info file predated removal of the reference and was removed locally |

The three deleted tracked files contained 622 bytes in total before related reference cleanup.

## 5. Deleted Directories

The following six verified-empty, untracked source directories were removed locally:

- `packages/core/src/components/heading/`
- `packages/core/src/components/text/`
- `packages/core/src/components/prose/`
- `packages/layouts/src/constants/`
- `packages/layouts/src/styles/`
- `packages/icons/src/showcase/components/`

They contained no hidden files and had no convention-based consumers. Git does not track empty
directories, so their removal does not change the commit tree or tracked directory count.

## 6. Archived Documents

No document was moved or newly archived.

The phase, cleanup, migration, and release records received these explicit decisions:

| Path | Status | Reason |
| --- | --- | --- |
| `docs/design-audit/phase-0-report.md` | ARCHIVE | Unique baseline inventory and risk record |
| `docs/design-audit/phase-1-report.md` | ARCHIVE | Unique token and contract decisions |
| `docs/design-audit/phase-2-report.md` | ARCHIVE | Unique color-system remediation evidence |
| `docs/design-audit/phase-3-report.md` | ARCHIVE | Unique component remediation evidence |
| `docs/design-audit/phase-4-report.md` | ARCHIVE | Unique package and integration evidence |
| `docs/design-audit/phase-5-report.md` | ARCHIVE | Unique final verification and release evidence |
| `docs/design-audit/accessibility-colors.md` | ARCHIVE | Historical accessibility findings with an explicit notice |
| `docs/design-audit/color-audit-report.md` | ARCHIVE | Historical before-state color measurements |
| `docs/design-audit/color-inventory.md` | ARCHIVE | Historical token inventory and provenance |
| `packages/core/docs/visual-baseline.md` | ARCHIVE | Historical visual baseline with an explicit notice |
| `docs/design-audit/vueforge-2-cleanup-report.md` | KEEP | Current architecture and compatibility-cleanup record |
| `docs/release-checklist.md` | KEEP | Current coordinated-release gates |
| `docs/release-notes.md` | KEEP | Current VueForge 2 release notes |
| `docs/public-release-assets.md` | KEEP | Current coordinated-release copy and assets |
| `docs/migration-to-v2.md` | KEEP | Canonical VueForge 1 to 2 user migration guide |
| `scripts/migrate-to-v2.mjs` | KEEP | Current migration codemod, referenced and tested |

`docs/migration-guide.md` was already absent from the audited baseline after its useful content had
been consolidated during the preceding compatibility cleanup; no second migration document was
deleted in this task.

The ten ARCHIVE documents retain unique baselines, decisions, measurements, and verification
evidence. They are already separated from current user guidance, so moving them would only create
link churn without improving clarity.

## 7. Retained Suspicious Files

| Path or group | Why it looked removable | Why it was retained |
| --- | --- | --- |
| `docs/design-audit/phase-0-report.md` through `phase-5-report.md` | Phase-specific reports are not user navigation pages | They contain unique decisions, measurements, platform limits, and release evidence |
| `docs/design-audit/{accessibility-colors,color-audit-report,color-inventory}.md` | They describe historical pre-remediation state | Explicit historical banners and cross-links make them intentional before/after baselines |
| `docs/migration-to-v2.md` and `scripts/migrate-to-v2.mjs` | Version-specific migration material | They are the current VueForge 1 to 2 path, referenced by release and package documentation and covered by tests |
| `docs/release-checklist.md`, `docs/release-notes.md`, `docs/public-release-assets.md` | Release-phase documents | They are the current coordinated-release gates, notes, and copy |
| 18 byte-identical component theming pages | Placeholder content is duplicated | Each is a live component tab referenced from its component index |
| `aside-area/api.md` and `sidebar-area/api.md` | Their contracts are currently identical | Each documents a different public component and participates in the API documentation matrix |
| Annabel and VueForge logo SVGs | The files are byte-identical | Both live imports represent distinct demo brands; the Annabel asset is also the example favicon |
| `packages/icons/src/lib/icons.json` | It has no runtime import | The icon generator creates and validates it as a tracked generated-source contract |
| Icons `App.vue`, `main.ts`, `index.html`, and showcase config | They are absent from package runtime exports | They are convention-based development and showcase entries |
| Package dependency and Vue declaration shims | They resemble temporary compatibility declarations | They support source-only type checking, declaration builds, and tests without prebuilt `dist` |
| `packages/layouts/tsconfig.node.tsbuildinfo` | Ignored generated artifact | It was removed locally after its orphan config was deleted; it was never tracked |

## 8. Scripts Audit

All 34 tracked files under root or package `scripts/` paths were retained.

- All 105 discovered `npm run` edges resolved.
- All 38 script-file references resolved.
- Build declaration finalization is called by five package builds.
- CSS, CJS/SSR, consumer-CSS, theme-type, and geometry checks are package test gates.
- Documentation, clean-install, package-contract, packed-consumer, tree-shaking, budget, and release
  scripts are root verification or workflow gates.
- `scripts/visual/phase-2-color-smoke.mjs` remains a current visual and accessibility regression gate.
- Icons generation, creation, and centering scripts remain active build or maintainer workflows.
- The migration script and its test remain required.

`tools/` and `bin/` do not exist, and no manifest declares a `bin`.

## 9. Test and Fixture Audit

Thirty-three package `*.spec.*` or `*.test.*` files are discovered by package test configurations.
Three root script tests are explicitly invoked. Seven additional mocks, setup files, helpers, or
consumer files have direct config or script callers. One CI shell harness orchestrates the
dist-independent workspace test run.

The repository contains:

- no tracked fixture directories;
- no tracked snapshots or `*.snap` files;
- no orphan browser baselines;
- no tracked consumer lockfiles or temporary consumer projects.

Icons smoke and render consumers are explicitly invoked, and the example intentionally uses
`--passWithNoTests`.

## 10. Documentation and Asset Audit

The documentation contract initially passed for 297 Markdown files, 58 component API pages, and all
eight publishable packages. All local Markdown targets, anchors, and image references resolved.

No Markdown file or image asset was deleted. Three stale items were corrected:

- the Link example now targets the active VueForge monorepo instead of the retired standalone Core
  repository;
- the Core foundation API identifies the current 2.x line instead of `1.0.0`;
- the example README describes the actual six-section showcase instead of a minimal basic example.

The Icons development HTML no longer requests a nonexistent `/favicon.ico`. All three tracked image
assets remain live.

## 11. Configuration Audit

One complete orphan config was deleted: `packages/layouts/tsconfig.node.json`.

The following dead fragments were removed:

- the deleted Icons declaration from `packages/icons/tsconfig.json`;
- two Vite `__APP_VERSION__` defines with no source consumer;
- the deleted Layouts `index.html` from its TypeScript include list;
- an ESLint override for nonexistent `packages/layouts/tests/**/*.ts` and its now-unused import;
- a duplicate Core Vitest block from `vite.config.ts`; official test commands use `vitest.config.ts`;
- a missing Icons favicon request.

All remaining Vite, Vitest, TypeScript, ESLint, Stylelint, HTMLHint, Markdownlint, Prettier, npm, Node,
editor, hook, workflow, and release configs have convention-based or explicit consumers.

No `.gitignore` change was needed. Existing rules cover `dist`, coverage, dependencies, caches,
generated sources, build info, tarballs, logs, OS metadata, IDE metadata, and the Icons showcase
output. No ignored file was also tracked.

## 12. Package Manifest Audit

All ten manifests were reviewed: the root, eight publishable packages, and one private example.

- Every public export target existed in the baseline build.
- Core mapped 85 export keys to 172 conditional targets.
- Layouts mapped 40 keys to 77 targets.
- The other packages mapped their declared JS, type, and CSS targets without gaps.
- `files: ["dist"]` prevented sources, tests, reports, and caches from entering tarballs.
- README, license, and package metadata were present.
- Side-effect declarations matched CSS and auto-style entries.
- Runtime dependency edges were declared and acyclic.
- No legacy top-level resolver field or dependency was proven removable.
- No manifest or lockfile change was needed.

## 13. Tarball Audit

Baseline no-script pack results:

| Package | Files | Packed bytes | Unpacked bytes |
| --- | ---: | ---: | ---: |
| Icons | 18 | 130,927 | 587,147 |
| Theme | 27 | 9,083 | 36,410 |
| Core | 530 | 273,785 | 1,932,164 |
| Layouts | 108 | 39,387 | 274,711 |
| CodeBlock | 53 | 371,021 | 1,978,341 |
| Playground Core | 5 | 7,915 | 25,358 |
| Playground | 16 | 12,790 | 51,420 |
| Playground Vite Plugin | 5 | 2,964 | 7,959 |
| **Total** | **762** | **847,872** | **4,893,510** |

Every baseline tarball contained only `dist/**`, `package.json`, `README.md`, and `LICENSE`.

Final pack results after the validation build:

| Package | Files | Packed bytes | Unpacked bytes |
| --- | ---: | ---: | ---: |
| Icons | 18 | 130,927 | 587,147 |
| Theme | 27 | 9,083 | 36,410 |
| Core | 530 | 273,785 | 1,932,164 |
| Layouts | 107 | 39,352 | 274,415 |
| CodeBlock | 53 | 371,021 | 1,978,341 |
| Playground Core | 5 | 7,915 | 25,358 |
| Playground | 16 | 12,790 | 51,420 |
| Playground Vite Plugin | 5 | 2,964 | 7,959 |
| **Total** | **761** | **847,837** | **4,893,214** |

| Measure | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Total files | 762 | 761 | -1 |
| Total packed bytes | 847,872 | 847,837 | -35 |
| Total unpacked bytes | 4,893,510 | 4,893,214 | -296 |

The only tarball delta is removal of the unexported generated declaration corresponding to the
deleted Layouts theme barrel. All public runtime, declaration, and CSS targets remain.

## 14. Validation Results

| Check | Result |
| --- | --- |
| `npm test` | Passed: all workspace suites, Icons smoke/render consumers, and both migration tests |
| `npm run verify` | Passed: clean install, CI-like tests, documentation fixtures, package contracts, packed consumers, CSS/SSR/CJS checks, tree shaking, and budgets |
| `npm run typecheck` | Passed in all nine workspaces |
| `npm run lint:all` | Passed for source, styles, HTML, Markdown, and data |
| `npm run lint:md` | Passed for all 298 final Markdown files |
| `npm run check:docs` | Passed for 298 Markdown files, 58 component API pages, and eight publishable packages |
| `npm run build` | Passed for all eight publishable packages |
| `npm run build:demo` | Passed; Vite emitted only its existing large-chunk advisory |
| `npm run prepublish:all` | Passed, including dry-run packing of all eight packages |
| `npm run audit:release` | Passed: production dependencies have zero vulnerabilities; the full development tree has one low-severity transitive `esbuild` advisory below the configured high-severity threshold |
| `npm run build:showcase -w @codemonster-ru/vueforge-icons` | Passed after removal of the unused version defines |
| `npm run visual:phase2` | Passed visual, state, accessibility, browser, network, and color-vision checks at two viewports; artifacts are in `/private/tmp/vueforge-phase2` |
| Final package-contract and tarball inspection | Passed for all eight packages; 761 files and every declared runtime, type, and CSS target remained |
| `git diff --check` | Passed |

## 15. Remaining Candidates

| Candidate | Reason retained | Follow-up condition |
| --- | --- | --- |
| Byte-identical Annabel and VueForge logos | Both are live and semantically distinct | Merge only after adopting a neutral shared brand asset |
| Component theming placeholders | They preserve complete component documentation routes | Consolidate only with a documented navigation architecture change |
| Historical phase and color reports | They preserve unique audit evidence | Keep in `docs/design-audit/`; do not expose as current user guidance |
| `docs/public-release-assets.md` | VueForge 2 coordinated release material remains active | Archive after the coordinated public release is complete |
| Hosted documentation freshness | The hosted portal is outside this repository | Re-sync the portal as part of release operations |

No remaining source, script, configuration, fixture, snapshot, or asset candidate has enough evidence
for deletion.

## 16. Final Recommendation

Commit the audited cleanup. Every mandatory repository check passed, the eight tarballs retained all
declared exports, and the final diff contains only the proven cleanup and this report. Do not publish,
tag, or create a release as part of this task.

### Final metrics

| Measure | Result |
| --- | ---: |
| Baseline Git-tracked files checked | 885 |
| Tracked files deleted | 3 |
| Empty local directories deleted | 6 |
| Documents newly archived | 0 |
| Historical documents retained in archival locations | 10 |
| Scripts deleted | 0 |
| Fixtures deleted | 0 |
| Snapshots deleted | 0 |
| Assets deleted | 0 |
| Ignored generated artifacts deleted locally | 1 |
| Final Git-tracked files | 883 |
| Git-tracked file-count change | -2 |
| Final tracked working-tree bytes | 3,675,675 |
| Tracked working-tree byte change | +17,400 |
| Total packed-byte change | -35 |

The tracked working tree is larger only because this required audit report is larger than the three
deleted files and associated configuration fragments. The publishable artifact set is smaller, and
no runtime or public-contract file was added.
