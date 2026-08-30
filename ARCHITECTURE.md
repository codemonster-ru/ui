# CodeMonster UI Monorepo Architecture

This repository contains the CodeMonster UI package line, the retained VueForge products, shared
contracts, cross-platform examples, and the tooling used to validate and publish them.

## Repository layout

- `packages/*` — publishable npm packages and the Annabel Razor adapter
- `examples/*` — local runnable examples for Vue and Annabel Razor
- `contracts/*` — component manifests, behavior contracts, schemas, and visual-fixture metadata
- `docs/*` — product, package, architecture, migration, and release documentation
- `migration/*` — machine-readable VueForge-to-CodeMonster UI migration data and checks
- `scripts/*` — build, CI, contract, migration, release, and visual-validation tooling
- `visual-baselines/*` — reviewed visual-regression reference images used by CI
- `.github/*` — repository workflows; `.githooks/*` — local Git hooks

The root `package.json` is a private npm workspace. Its workspaces are `packages/*` and
`examples/*`; `package-lock.json` is the authoritative lockfile for that workspace.

## Package structure standard

Each publishable npm package should keep a consistent shape:

- `src/` — source code only
- `README.md` — minimal public package description + docs link
- `CHANGELOG.md` — release history
- `package.json` — package metadata and scripts
- `LICENSE` — package license file
- tests colocated in one of these forms (pick one per package and stay consistent):
  - `src/**/*.spec.ts`
  - `src/**/__tests__/*`
  - `test/*`

The `razor` package follows Composer conventions and keeps its PHP metadata and tests alongside
the adapter source. Shared CodeMonster UI packages use the `ui-*` naming line; retained VueForge
products keep their published `vueforge-*` names while they are in maintenance.

## Naming conventions

### Vue components

- Component file names: `Vf*.vue`
- Public component names and plugin registrations: `Vf*`
- No `Vue*`/legacy aliases in public API

### CSS classes and tokens

- Base namespace: `vf-`
- Package namespaces:
  - `core`: `vf-*`
  - `layouts`: `vf-layout-*` (plus component-specific `vf-*` blocks)
  - `codeblock`: `vf-codeblock*` / `--vf-codeblock-*`
  - `playground`: `vf-playground*` / `--vf-playground-*`
  - `icons`: `vf-icon*` / `--vf-icon-*`
- Legacy prefixes (`vif*`, `vcb*`, `cm-*`) are not used for new code.

## Shared behaviour layer

A component's behaviour is written once, in `packages/runtime/src/core/`, and published from
`@codemonster-ru/ui-runtime/core`. Adapters translate; they do not decide.

The layer holds pure functions over plain data. No DOM, no reactivity, no framework import, and no
throwing — an unusable input returns a value the caller can render (often `null`) rather than an
exception. That keeps it safe to import during server rendering and callable from a controller that
owns real elements.

Each behavioural component is expected to split three ways:

- `runtime/src/core/<component>.ts` — the rules: which item is active, where a key moves focus,
  what a set of props reduces to.
- `runtime/src/<component>.ts` — a `CmController` that reads those rules off the rendered DOM and
  writes the result back to it, for server-rendered and Annabel Razor pages.
- `vue/src/components/<component>/` — a Vue component that feeds the same rules from its props and
  binds the result declaratively.

Rules for the layer:

- Adapters must not re-implement a rule the core already owns. Two copies of one algorithm is the
  defect this layer exists to prevent.
- The core is externalised in each adapter's library build, so an application using more than one
  adapter links a single copy.
- Core modules are tested directly, without a DOM and without mounting a component. Adapter tests
  cover translation and markup, not the rules.
- Components with no behaviour — layout primitives, badges, cards — have no core module and need
  none.

`Tabs` is the reference implementation.

## Dependency rules

- Published package runtime dependencies must use semver ranges.
- Local development may rely on workspaces, but publish-time metadata must remain valid for npm consumers.
- Shared framework packages (`vue`, etc.) should stay in `peerDependencies` where appropriate.

## Scripts policy

Each publishable npm package should expose, where applicable:

- `build`
- `lint`
- `typecheck`
- `check` (aggregates lint/typecheck/tests/build as applicable)
- `format` and `format:check` — both, or neither. A package with only `format` is skipped by the
  root `format:check`, which runs with `--if-present`, so its formatting goes unverified.
- `prepack` (usually calls `build`)

The root scripts compose package checks with repository-level documentation, contract, migration,
consumer, and visual checks. New repository checks should be added to the root workflow only when
they validate a cross-package invariant.

## Release hygiene

Before release:

1. Ensure package version bump matches change scope (`patch`/`minor`, avoid unnecessary `major`).
2. Update package `CHANGELOG.md` with user-visible changes.
3. Run package-level `check` for touched packages.
4. Run root `build` and `prepublish:all` before publishing.
5. Avoid committing generated/local-only artifacts unless intentionally part of package contents.
6. Keep local `node_modules`, `.npm-cache`, `.DS_Store`, build output, and test coverage out of Git.

## Non-goals

- No broad refactors without clear value.
- No parallel naming systems for the same concept.
- No hidden breaking changes.
