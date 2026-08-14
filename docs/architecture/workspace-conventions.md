# CodeMonster UI workspace conventions

Status: Active  
Date: 2026-08-11  
Roadmap item: `CMUI-016`

## Purpose

These conventions define how npm packages, the Composer adapter, contracts, examples, generated
artifacts, and repository tooling coexist while VueForge and CodeMonster UI share this monorepo.

They establish repository shape and ownership. Package metadata validation, contract fixtures, and
root orchestration are implemented by their later roadmap items.

## Top-level ownership

| Path                 | Responsibility                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| `contracts/`         | Framework-independent component manifests, cases, canonical HTML, and scenarios |
| `packages/`          | Publishable npm packages and the Composer UI package                            |
| `examples/`          | Runnable consumer examples by platform                                          |
| `docs/architecture/` | Accepted product and engineering decisions                                      |
| `docs/`              | User guides, migration documentation, audits, and the roadmap                   |
| `scripts/build/`     | Deterministic artifact generation and finalization                              |
| `scripts/ci/`        | Repository, package, contract, and consumer validation                          |
| `scripts/visual/`    | Shared visual fixture and regression tooling                                    |

Do not add a new top-level directory when one of these owners fits. A new owner requires a documented
reason and a roadmap update.

## Package directories

Public distribution directories use lowercase kebab-case names matching their package suffix:

```text
packages/tokens
packages/css
packages/utilities
packages/icons
packages/runtime
packages/vue
packages/react
packages/angular
packages/razor
```

Existing VueForge directory names remain unchanged during migration. A CodeMonster UI package does
not reuse an existing VueForge directory until a dedicated migration step transfers ownership.

Every npm package contains only files it owns:

```text
package.json
README.md
CHANGELOG.md
LICENSE
src/
scripts/          # only package-specific tooling
__tests__/        # integration tests when source-local tests are unsuitable
```

Configuration files stay package-local when tools require different platform plugins, compilation
targets, or environments. Shared root configuration contains only rules valid across its consumers.

## npm workspace conventions

The root npm workspace remains authoritative for JavaScript dependency installation and the npm
lockfile. New npm packages live under `packages/*`; runnable npm examples live under `examples/*`.

Public npm packages:

- use ESM as their primary module format;
- declare the approved package name and Node.js policy;
- declare explicit `exports` and `files` boundaries;
- set `publishConfig.access` to `public`;
- keep framework packages in `peerDependencies` of the matching adapter;
- keep build and test tooling in `devDependencies`;
- declare CSS and browser side effects narrowly;
- do not resolve public consumers through workspace-only aliases.

Standard scripts are:

| Script      | Responsibility                                          |
| ----------- | ------------------------------------------------------- |
| `build`     | Produce clean publishable artifacts                     |
| `check`     | Run the package's complete pre-merge validation         |
| `lint`      | Run source linting owned by the package                 |
| `test`      | Run deterministic package tests                         |
| `typecheck` | Validate public and internal types without emitting     |
| `format`    | Apply repository formatting conventions where supported |
| `prepack`   | Rebuild or validate the exact archive inputs            |

A package may add focused smoke or generation scripts. Root orchestration is added only after the
package can run independently.

## Composer workspace conventions

`packages/razor` is the publishable `codemonster-ru/ui-razor` Composer library. It has no `package.json`
unless a later decision gives it an independently justified npm responsibility; copied frontend
artifacts do not justify making it an npm package.

The Composer package owns:

- `composer.json` and PHP autoloading;
- `src/` PHP component and integration code;
- `resources/views/` Annabel Razor templates;
- `resources/assets/` verified copied CodeMonster UI artifacts;
- PHP unit, static-analysis, rendering, and archive tests.

Composer dependencies install into an ignored `vendor/` directory. Composer caches, PHPUnit caches,
PHPStan caches, and local `composer.phar` files remain untracked. The package must be testable from a
fresh Composer install without npm workspace resolution.

## Source and test placement

- Keep a unit test next to its source when the existing package convention does so.
- Use `__tests__/` for package integration, built-artifact, or consumer tests.
- Put cross-platform contract cases under `contracts/`, not inside the first adapter implementing
  them.
- Put adapter-specific behavior in its adapter tests.
- Put packed-consumer orchestration under `scripts/ci/`.
- Do not make examples the only verification of public behavior.

Test filenames follow the owning tool's established convention. A package must not duplicate a
fixture merely to adapt its path; shared harnesses receive the canonical fixture path explicitly.

## Generated and local artifacts

The repository does not track local build or dependency output:

```text
dist/
coverage/
node_modules/
vendor/
.cache/
.vite/
.generated/
*.tsbuildinfo
```

Generated source inputs are committed only when they are intentional reviewed product data, such as
an icon catalog or contract manifest. Reproducible build output remains ignored and is recreated by
package and release checks.

Temporary archive inspection uses an explicit temporary directory or the existing ignored cache
locations. Scripts must not write consumer output into another package's source tree.

## Formatting and line endings

The root `.editorconfig` establishes UTF-8, LF endings, final newlines, spaces, and trailing-space
cleanup. JavaScript, TypeScript, JSON, CSS, YAML, and documentation use two-space indentation where
indentation applies. PHP uses four spaces. Markdown preserves deliberate trailing spaces for hard
line breaks.

Formatters and linters remain authoritative for syntax-specific rules.

## Dependency and ownership rules

- Shared packages never import a platform adapter.
- Adapters never import another adapter.
- New packages do not import VueForge source through relative paths.
- Cross-package source aliases are development conveniences only and cannot leak into declarations
  or built output.
- Copying built artifacts across distributions occurs in one deterministic build step with integrity
  verification.
- Unrelated package configuration does not change when scaffolding a new package.

These rules are automated incrementally by `CMUI-017`, `CMUI-024`, and `CMUI-025`.

## Change policy

Add packages, scripts, and shared configuration in the roadmap step that first needs them. Do not
pre-create empty adapters or speculative shared utilities. Every workspace change must leave
existing VueForge packages buildable until their approved migration phase.
