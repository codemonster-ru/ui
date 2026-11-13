# CodeMonster UI package topology and releases

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-013`

## Decision

CodeMonster UI is developed as one source monorepo containing shared packages, platform adapters,
contracts, tests, and examples. Public packages use independent semantic
versions and are published in dependency order.

## Target repository layout

```text
contracts/
  button/
  card/
  input/
  accordion/
packages/
  tokens/
  css/
  utilities/
  icons/
  runtime/
  vue/
  layouts/
examples/
  ui-showcase/
  vanilla/
docs/
scripts/
```

## Public distributions

| Directory            | Distribution                   | Runtime responsibility                                           |
| -------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `packages/tokens`    | `@codemonster-ru/ui-tokens`    | Token data, theme APIs, generated token CSS                      |
| `packages/css`       | `@codemonster-ru/ui-css`       | Foundation and semantic component CSS                            |
| `packages/utilities` | `@codemonster-ru/ui-utilities` | Generated utility CSS                                            |
| `packages/icons`     | `@codemonster-ru/ui-icons`     | Framework-independent icon data and rendering primitives         |
| `packages/runtime`   | `@codemonster-ru/ui-runtime`   | Optional progressive-enhancement DOM controllers                 |
| `packages/layouts`   | `@codemonster-ru/ui-layouts`   | Vue page layouts and shared layout contracts                     |
| `packages/vue`       | `@codemonster-ru/ui-vue`       | Vue adapter                                                      |

Contracts and test harnesses remain private repository tooling initially. No umbrella npm package is
part of the approved topology.

## Package dependency graph

```text
ui-tokens ------> ui-css --------+
     |                             |
     +----------> ui-utilities     +----> ui-vue
ui-icons --------------------------+----> ui-layouts

ui-runtime ----------------------------> Vanilla HTML consumers

```

The graph follows these rules:

- shared packages never depend on platform adapters;
- adapters never depend on one another;
- UI frameworks remain peer dependencies of their adapters;
- `ui-css` and `ui-utilities` consume generated token artifacts through declared build and package
  relationships;
- adapter JavaScript does not require `ui-runtime` for framework-owned roots;
- component-level CSS exports remain usable without importing adapter JavaScript;
- full linked stylesheets are self-contained or have explicit documented companion imports;
- workspace aliases cannot be required for packed consumers.

Exact dependency fields and CSS export behavior are verified when each package is scaffolded.

## Versioning

Each public package follows SemVer independently. Independent versions avoid publishing unchanged
framework adapters for a tokens-only or runtime-only change.

Compatibility is expressed through reviewed dependency and peer ranges. A cross-cutting contract
change may require a coordinated release of several independently versioned packages. Coordinated
does not mean numerically synchronized.

Rules:

- public contract removals and incompatible semantic changes require the appropriate major release;
- adapter support for a new shared component releases only after its stable contract cases pass;
- dependency ranges are not widened without packed-consumer verification;
- prerelease packages use a consistent channel for one coordinated change;
- repository documentation publishes a compatibility table for stable releases.

## Release order

Publish only changed packages and their required dependants in this topological order:

1. `ui-tokens`;
2. `ui-icons` and `ui-runtime` where changed;
3. `ui-css` and `ui-utilities`;
4. `ui-vue` and `ui-layouts`;
5. examples and documentation after registry consumers pass.

Independent packages at the same level may verify in parallel, but dependent publication waits for
registry verification of its prerequisites.

## Release ownership

The monorepo owns:

- package versions and changelogs;
- package export and dependency contracts;
- npm archive contents;
- cross-platform compatibility metadata;
- provenance and integrity verification;
- registry consumer smoke tests;
- coordinated release notes.

Every public package has one explicit release contract in repository automation. Adding a directory
to a workspace does not make it publishable automatically.

## Distribution verification

Before publication, affected packages pass:

- clean build without pre-existing `dist` artifacts;
- manifest and export-target validation;
- npm archive inspection;
- fresh consumer installation without workspace links;
- framework peer and declaration-resolution checks;
- browser or Node SSR checks applicable to the package;
- CSS direct-import and linked-asset checks;
- size budgets and tree-shaking checks where applicable;
- provenance, integrity, license, repository, and changelog checks.

Initial package-level ceilings are measured across built runtime artifacts. Gzip totals are the sum
of each emitted file compressed independently, so duplicated output is visible rather than hidden
by archive compression.

| Package          | CSS raw | CSS gzip | JavaScript gzip |
| ---------------- | ------- | -------- | --------------- |
| `ui-tokens`      | 64 KiB  | 12 KiB   | 24 KiB          |
| `ui-icons`       | 0       | 0        | 256 KiB         |
| `ui-runtime`     | 0       | 0        | 32 KiB          |
| `ui-css`         | 320 KiB | 48 KiB   | 8 KiB           |
| `ui-utilities`   | 256 KiB | 32 KiB   | 8 KiB           |
| Platform adapter | 32 KiB  | 8 KiB    | 128 KiB         |

Budgets are ceilings, not targets. Raising one requires a reviewed architecture or product reason;
normal feature work must stay within the existing limit.

After publication, the same representative consumers install registry artifacts before dependants
or documentation are released.

## Consequences

- One repository keeps contracts, CSS, adapters, and browser assets reviewable together.
- Independent versions reduce release churn while compatibility remains explicit.
- Release automation can enforce the architecture through a small acyclic dependency graph.
