# VueForge 2 Compatibility Cleanup Report

## 1. Executive Summary

VueForge 2 now has one canonical token, theme, runtime, and package-resolution architecture. The
audit covered every publishable package, source and generated CSS contract, public TypeScript
surface, runtime branch, build helper, fixture, example, and current-facing document.

The cleanup removes only code proven to exist for VueForge 1.x compatibility or to be unreachable
in the current architecture. It does not change the built-in OKLCH values, visual design,
accessibility model, component set, or supported CommonJS contract.

The tracked diff removes nine files and 2,923 lines gross. Artifact comparison shows a 7.80% raw CSS
reduction and a 17.09% declaration-size reduction. Raw JavaScript is 0.73% smaller; aggregate
per-file gzip is 0.31% larger because chunk contents and compression boundaries changed.

## 2. Legacy Inventory

| Area               | Proven legacy or dead inventory                                                                                                                           | Proof used                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Theme tokens       | 34 flat `color*` roots plus `overlayBackdrop`; generic `shadow`; compatibility maps and alias depth                                                       | Canonical primitive/semantic schema, component consumers, serializer parity tests |
| Component tokens   | Two no-op button filters, unused Table of Contents title color, one unused Layouts token, two unused CodeBlock opacity hooks, 14 retired Playground hooks | Source-reference search, built CSS, rendered component structure                  |
| Public API         | Four deprecated `Vueforge*` types, two old Shiki constants, inert Icons `style` prop, empty dual-style export                                             | Deprecation annotations, zero-value fixture, solid-only catalog and history       |
| Runtime            | Implicit `data-theme` mirroring/observation, Shiki legacy fallback chains, two unreachable/identical branches                                             | Normalization order, mutation observers, branch equivalence, runtime tests        |
| Package resolution | 24 top-level `main`/`module`/`types` fields, Core `typesVersions`, unexported Playground index build                                                      | Complete `exports` maps and packed-consumer resolution                            |
| CSS structure      | Six forwarding-only grouped Core manifests and 56 removed custom-property declarations                                                                    | Import graph, declaration inventory, component-entry parity                       |
| Source/build       | Unexported `useSidebarState`, obsolete icon variant generation, obsolete icon fixture                                                                     | Package exports, zero imports, solid-only component catalog                       |
| Documentation      | 1.x migration guide, stale versions, legacy examples, obsolete token/API references                                                                       | Link, token, import, version, and migration-checker audits                        |

Historical changelogs and earlier design-audit reports retain their contemporary 1.x terminology as
an intentional record. They are not current API documentation.

## 3. Removed Compatibility

- Removed the 35 legacy theme roots from runtime values, static CSS, mappings, interfaces, tests,
  and documentation.
- Removed the implicit `data-theme` path from Theme, Core, Layouts, CodeBlock, Playground, and
  sandbox previews.
- Removed terminal legacy CSS fallbacks from Core, Layouts, CodeBlock, Playground, and Shiki theme
  generation.
- Removed deprecated public aliases and empty/inert Icons APIs.
- Removed resolver metadata that bypassed authoritative package `exports`.
- Removed forwarding-only CSS manifests and the unsupported Playground root build entry.
- Removed dead branches, an orphan composable, and the obsolete regular-icon generator path.

The following were audited and retained because they are current contracts, not compatibility
layers:

- advertised CommonJS and CSS-free Node/SSR conditions;
- explicit browser CSS exports and auto-CSS component entries;
- custom theme prefixes and explicitly configured theme attributes;
- the canonical custom-prefix bridge needed by package CSS;
- Playground class-based iframe theme interoperability;
- CodeBlock literal fallbacks for standalone use;
- documented language aliases such as `text`, `txt`, `sh`, and `env`;
- the Icons UMD artifact previously documented as a supported direct-CDN build.

## 4. Public API Changes

| Removed API                             | VueForge 2 action                                         |
| --------------------------------------- | --------------------------------------------------------- |
| 35 legacy theme token fields            | Use the primitive/semantic mapping in the migration guide |
| `VueforgePlaygroundVirtual*` types      | Use the existing `VueForgePlaygroundVirtual*` names       |
| `SHIKI_LIGHT_THEME`, `SHIKI_DARK_THEME` | Remove the imports and select `light` or `dark` mode      |
| `VueIconify` `style="solid"`            | Remove the inert prop; the package is solid-only          |
| `dualStyleCoreIconNames`                | Remove the import; the exported array was empty           |
| Generic/no-op component styling hooks   | Use the active semantic or component-specific hook        |
| Resolver-only package roots             | Resolve documented entries through package `exports`      |

No deprecated emit, slot, overload, or supported composable was found. The deleted
`useSidebarState` file was never reachable through a package export.

Seven public exports were removed: four deprecated type aliases, two CodeBlock constants, and the
empty Icons runtime export. Export-map subpaths remain at 142 because supported entry points were
preserved.

## 5. Theme Simplification

The default preset now combines primitive colors, semantic colors, and component tokens directly.
Semantic colors point to primitives instead of passing through flat 1.x roots. Static artifacts and
runtime styles use the same serializer and the same resolved preset.

`data-vf-theme` is the only implicit selector. A caller may still configure a custom attribute; the
provider synchronizes that explicit attribute with the canonical engine boundary. Custom prefixes
retain a narrow bridge to the canonical package variables because package CSS consumes those
variables as part of the current theming contract.

Complete presets must provide the complete built-in `VfThemeTokens` contract. `light`, `dark`,
`extend`, and component override inputs remain partial. The light/dark OKLCH values are unchanged.

## 6. CSS Simplification

The cleanup removes 56 declared CSS variables:

- 35 legacy color/backdrop roots;
- two button filter hooks;
- the generic shadow hook;
- one unused Table of Contents hook;
- one unused Layouts hook;
- two unused CodeBlock opacity hooks;
- 14 retired Playground hooks.

Six Core CSS files that only re-exported other files were deleted. Component entries now import the
required canonical entries directly. Compatibility selectors and nested legacy fallbacks were
removed, while standalone literal fallbacks and active semantic/component fallbacks remain.

Across built CSS, declaration occurrences fall from 11,848 to 11,197 and unique declared custom
properties fall from 1,362 to 1,306.

## 7. Runtime Simplification

- Theme observation and mutation now use `data-vf-theme` plus only explicitly configured
  attributes.
- CodeBlock no longer reads, emits, or observes `data-theme`.
- Playground host and iframe runtime no longer mirror `data-theme`.
- Shiki variables now resolve from one semantic variable to the unchanged literal fallback.
- CodeBlock highlighter initialization no longer contains impossible null and normalized-language
  branches.
- Playground Core uses one identical local import/re-export rewrite path.

The guarded plain-code fallback, SSR-safe paths, storage failure handling, and unknown-icon fallback
remain because they are reachable resilience behavior.

## 8. TypeScript Simplification

- Removed four deprecated `Vueforge*` aliases and their duplicated contracts.
- Removed legacy color fields, `overlayBackdrop`, generic `shadow`, and unused component fields.
- Made primitive, semantic, and built-in non-color fields required for complete presets.
- Kept partial types only at documented override boundaries.
- Removed the obsolete Core typography `Omit` and the duplicate internal
  `semanticColorTokens` alias.
- Removed Core `typesVersions`; declaration resolution is fully represented by `exports`.

The built declaration set decreases by two files and 59,062 bytes.

## 9. Build Simplification

- All eight manifests use `exports` as the sole resolver contract.
- A package-contract gate rejects future top-level `main`, `module`, `types`, `style`, or
  `typesVersions` metadata.
- Playground no longer emits an unsupported package-root JavaScript entry.
- Core component CSS entries no longer route through six import-only manifests.
- The Icons generator derives the solid catalog directly and rejects removed variant metadata.
- Version, internal dependency, packed-consumer, and release matrices are synchronized for the
  coordinated breaking release.

Supported CJS, Node ESM, browser ESM, CSS, and declaration conditions are unchanged.

## 10. Performance Comparison

The baseline was captured from a clean full build of the untouched pre-cleanup commit. The final
snapshot uses the same Node.js 24/npm 11 environment and the same build command. Byte totals include
all eight publishable `dist` directories; gzip totals compress each artifact independently and sum
the results.

| Metric                        |    Before |     After |            Change |
| ----------------------------- | --------: | --------: | ----------------: |
| JavaScript files              |       227 |       226 |                -1 |
| JavaScript bytes              | 3,127,222 | 3,104,516 |  -22,706 (-0.73%) |
| JavaScript gzip bytes         |   651,784 |   653,828 |   +2,044 (+0.31%) |
| CSS files                     |        76 |        76 |                 0 |
| CSS bytes                     | 1,456,338 | 1,342,734 | -113,604 (-7.80%) |
| CSS gzip bytes                |   188,280 |   181,094 |   -7,186 (-3.82%) |
| Declaration files             |       280 |       278 |                -2 |
| Declaration bytes             |   345,493 |   286,431 | -59,062 (-17.09%) |
| Declaration gzip bytes        |    91,781 |    85,522 |   -6,259 (-6.82%) |
| Theme runtime files           |         8 |         8 |                 0 |
| Theme runtime bytes           |    10,678 |    10,643 |      -35 (-0.33%) |
| Theme runtime gzip bytes      |     3,112 |     3,134 |      +22 (+0.71%) |
| Package export subpaths       |       142 |       142 |                 0 |
| Top-level resolver fields     |        24 |         0 |               -24 |
| Unique declared CSS variables |     1,362 |     1,306 |               -56 |
| CSS variable declarations     |    11,848 |    11,197 |              -651 |
| Default theme token mappings  |       997 |       958 |               -39 |
| Default dark overrides        |       137 |       101 |               -36 |
| Core root runtime exports     |        62 |        62 |                 0 |
| Icons root runtime exports    |         8 |         7 |                -1 |

Required cleanup totals:

| Cleanup metric                 |                                          Result |
| ------------------------------ | ----------------------------------------------: |
| Deleted files                  |                                               9 |
| Gross deleted tracked lines    |                                           2,923 |
| Removed alias paths            |                                              41 |
| Removed declared CSS variables |                                              56 |
| Removed public exports         |                                               7 |
| Bundle reduction               | 22,706 raw bytes; gzip increased by 2,044 bytes |
| CSS reduction                  |             113,604 raw bytes; 7,186 gzip bytes |
| Theme runtime reduction        |        35 raw bytes; gzip increased by 22 bytes |

The 41 alias paths comprise 35 theme roots, four deprecated TypeScript aliases, the duplicate
internal semantic-token alias, and the implicit `data-theme` alias path.

## 11. Breaking Changes

- Replace all legacy token fields and CSS variables with primitive or semantic names.
- Replace implicit `data-theme` boundaries with `data-vf-theme`.
- Supply every required field in a complete custom preset.
- Rename deprecated Vite-plugin type imports.
- Remove old Shiki constant imports, the Icons `style` prop, and the empty dual-style export.
- Remove overrides for no-op/retired component variables.
- Use a resolver that honors package `exports`.
- Keep CodeBlock and Playground JavaScript imports on their documented subpaths.

Package release lines are Theme 2, Icons 2, Core 2, Layouts 2, CodeBlock 4, Playground Core 2,
Playground Vite Plugin 1, and Playground 3.

## 12. Migration Guide

The complete old-to-new mapping, platform floors, package-entry changes, and manual review guidance
are in [Migrating to VueForge 2](../migration-to-v2.md).

The dependency-free migration checker defaults to read-only mode:

```bash
node scripts/migrate-to-v2.mjs src
node scripts/migrate-to-v2.mjs --write src
```

It applies deterministic VueForge CSS-variable and type-casing changes and reports theme fields,
theme attributes, removed APIs, and styling hooks that need semantic judgment. Its test suite
verifies read-only behavior, write behavior, overlapping token names, nested CSS fallback collapse,
manual findings, and idempotence.

## 13. Remaining Technical Debt

- Icons still emits `dist/index.ts.umd.js`. Prior architecture records identify UMD as supported,
  so the doubt rule requires preserving it. The README now documents it, but the packed-consumer
  matrix does not yet execute a browser-global UMD consumer.
- The optional Playground TypeScript compiler chunk remains intentionally large and deferred. It is
  unrelated to compatibility cleanup and remains protected by deferred-runtime budgets.
- Historical audit reports and changelog entries intentionally contain old names. Removing them
  would erase release history rather than simplify runtime or public API.

No unclassified compatibility path remains in the current source, build, package, or documentation
contracts.

## 14. Final Architecture

The resulting architecture has one direction:

`primitive tokens → semantic tokens → component tokens → shared serializer → static/runtime CSS`

Theme mode flows through `data-vf-theme` or an explicitly configured attribute. Package consumers
resolve ESM, CJS, Node, browser, declarations, and CSS only through `exports`. Core CSS component
entries import their real dependencies directly. CodeBlock and Playground keep separate UI/runtime
boundaries and load their heavy engines only when requested.

Final acceptance status: passed. `npm test`, `npm run verify`, `npm run typecheck`,
`npm run lint:all`, `npm run build`, `npm run build:demo`, and `npm run prepublish:all` completed
successfully. The verification matrix covered documentation fixtures, clean-install behavior,
package contracts, real npm/pnpm/Yarn tarballs, Bundler and NodeNext declarations, browser ESM,
CommonJS and ESM SSR, explicit CSS exports, tree shaking, and deferred-runtime budgets.
