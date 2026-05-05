# VueForge Monorepo Architecture

## Repository layout

- `packages/*` — publishable npm packages
- `examples/*` — local demo/playground apps
- `scripts/*` — CI/release helper scripts

## Package structure standard

Each package should keep a consistent shape:

- `src/` — source code only
- `README.md` — minimal public package description + docs link
- `CHANGELOG.md` — release history
- `package.json` — package metadata and scripts
- `LICENSE` — package license file
- tests colocated in one of these forms (pick one per package and stay consistent):
  - `src/**/*.spec.ts`
  - `src/**/__tests__/*`
  - `test/*`

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

## Dependency rules

- Published package runtime dependencies must use semver ranges.
- Local development may rely on workspaces, but publish-time metadata must remain valid for npm consumers.
- Shared framework packages (`vue`, etc.) should stay in `peerDependencies` where appropriate.

## Scripts policy

Each publishable package should expose at least:

- `build`
- `lint`
- `typecheck`
- `check` (aggregates lint/typecheck/tests/build as applicable)
- `prepack` (usually calls `build`)

## Release hygiene

Before release:

1. Ensure package version bump matches change scope (`patch`/`minor`, avoid unnecessary `major`).
2. Update package `CHANGELOG.md` with user-visible changes.
3. Run package-level `check` for touched packages.
4. Run root `build` and `prepublish:all` before publishing.
5. Avoid committing generated/local-only artifacts unless intentionally part of package contents.

## Non-goals

- No broad refactors without clear value.
- No parallel naming systems for the same concept.
- No hidden breaking changes.
