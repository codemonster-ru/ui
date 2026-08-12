# CodeMonster UI package topology and releases

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-013`

## Decision

CodeMonster UI is developed as one source monorepo containing shared packages, platform adapters,
contracts, tests, examples, and the Composer distribution. Public packages use independent semantic
versions and are published in dependency order.

Annabel remains a separate framework repository. CodeMonster UI consumes its public Razor component
API and does not copy the template compiler into this monorepo.

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
  react/
  angular/
  razor/
examples/
  css/
  vue/
  react/
  angular/
  razor/
docs/
scripts/
```

`packages/razor` is a Composer package and is not an npm workspace package. Repository scripts may
orchestrate both npm and Composer commands without forcing PHP consumers to install Node.js.

## Public distributions

| Directory | Distribution | Runtime responsibility |
| --- | --- | --- |
| `packages/tokens` | `@codemonster-ru/ui-tokens` | Token data, theme APIs, generated token CSS |
| `packages/css` | `@codemonster-ru/ui-css` | Foundation and semantic component CSS |
| `packages/utilities` | `@codemonster-ru/ui-utilities` | Generated utility CSS |
| `packages/icons` | `@codemonster-ru/ui-icons` | Framework-independent icon data and rendering primitives |
| `packages/runtime` | `@codemonster-ru/ui-runtime` | Optional progressive-enhancement DOM controllers |
| `packages/vue` | `@codemonster-ru/ui-vue` | Vue adapter |
| `packages/react` | `@codemonster-ru/ui-react` | React adapter |
| `packages/angular` | `@codemonster-ru/ui-angular` | Angular adapter |
| `packages/razor` | `codemonster-ru/ui` | PHP components, Razor templates, registration, and static assets |

Contracts and test harnesses remain private repository tooling initially. No umbrella npm package is
part of the approved topology.

## Package dependency graph

```text
ui-tokens ------> ui-css --------+
     |                             |
     +----------> ui-utilities     +----> ui-vue
                                   +----> ui-react
ui-icons --------------------------+----> ui-angular

ui-runtime ----------------------------> CSS/Razor progressive consumers

built tokens, CSS, icons, and runtime artifacts
     +---------------------------------> Composer UI
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
- the Composer build copies only verified public artifacts and records their source versions and
  integrity values;
- workspace aliases cannot be required for packed or Composer consumers.

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
- Composer releases record the exact shared artifact sources included in the archive;
- repository documentation publishes a compatibility table for stable releases.

## Release order

Publish only changed packages and their required dependants in this topological order:

1. `ui-tokens`;
2. `ui-icons` and `ui-runtime` where changed;
3. `ui-css` and `ui-utilities`;
4. `ui-vue`, `ui-react`, and `ui-angular`;
5. Composer `codemonster-ru/ui`;
6. examples and documentation after registry consumers pass.

Independent packages at the same level may verify in parallel, but dependent publication waits for
registry verification of its prerequisites.

## Release ownership

The monorepo owns:

- package versions and changelogs;
- package export and dependency contracts;
- npm and Composer archive contents;
- cross-platform compatibility metadata;
- provenance and integrity verification;
- registry consumer smoke tests;
- coordinated release notes.

Annabel owns its Razor release and compatibility declaration. CodeMonster UI does not publish an
Annabel development commit as a stable dependency.

Every public package has one explicit release contract in repository automation. Adding a directory
to a workspace does not make it publishable automatically.

## Distribution verification

Before publication, affected packages pass:

- clean build without pre-existing `dist` artifacts;
- manifest and export-target validation;
- npm or Composer archive inspection;
- fresh consumer installation without workspace links;
- framework peer and declaration-resolution checks;
- browser, Node SSR, or PHP rendering checks applicable to the package;
- CSS direct-import and linked-asset checks;
- size budgets and tree-shaking checks where applicable;
- provenance, integrity, license, repository, and changelog checks.

Initial package-level ceilings are measured across built runtime artifacts. Gzip totals are the sum
of each emitted file compressed independently, so duplicated output is visible rather than hidden
by archive compression.

| Package | CSS raw | CSS gzip | JavaScript gzip |
| --- | ---: | ---: | ---: |
| `ui-tokens` | 64 KiB | 12 KiB | 24 KiB |
| `ui-icons` | 0 | 0 | 256 KiB |
| `ui-runtime` | 0 | 0 | 32 KiB |
| `ui-css` | 320 KiB | 48 KiB | 8 KiB |
| `ui-utilities` | 256 KiB | 32 KiB | 8 KiB |
| Platform adapter | 32 KiB | 8 KiB | 128 KiB |

Budgets are ceilings, not targets. Raising one requires a reviewed architecture or product reason;
normal feature work must stay within the existing limit.

After publication, the same representative consumers install registry artifacts before dependants
or documentation are released.

## Consequences

- One repository keeps contracts, CSS, adapters, and PHP assets reviewable together.
- Independent versions reduce release churn while compatibility remains explicit.
- Composer consumers receive the same artifacts without adding a Node.js production requirement.
- Release automation can enforce the architecture through a small acyclic dependency graph.
