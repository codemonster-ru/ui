# CodeMonster UI component contracts

This directory contains the framework-independent public contracts implemented by every supported
CodeMonster UI adapter. Contracts are product inputs, not snapshots generated from Vue or another
renderer.

The normative format is defined in
[component-contract-format.md](../docs/architecture/component-contract-format.md). Canonical markup
and comparison rules are defined in [canonical-html.md](../docs/architecture/canonical-html.md).

## Layout

Each public component owns one lowercase kebab-case directory directly below `contracts/`:

```text
contracts/
  schema/
    component-manifest.schema.json
  button/
    contract.md
    manifest.json
    cases/
      default.case.json
      default.html
    behavior/
      keyboard.scenario.json
```

Only `schema/` is reserved. Component directories are added when their first real contract is
implemented; do not commit empty directories or speculative component placeholders.

## Required component files

Every component directory contains:

- `contract.md` for normative semantics, constraints, and allowed platform deviations;
- `manifest.json` for the machine-readable public API and externally observable states;
- `cases/` with at least one paired `*.case.json` input and canonical `*.html` result.

Interactive components also contain `behavior/` with one or more `*.scenario.json` files. Static
components do not add an empty behavior directory.

## Naming

- Directory and file identifiers use lowercase kebab-case.
- `manifest.json` `slug` matches its directory name.
- The public component name uses PascalCase without the `Cm` platform prefix.
- The Razor tag uses the approved `cm-` prefix.
- A case input and its canonical HTML share the same basename.
- Scenario IDs and case IDs are unique across the owning component.

## Ownership

Contract changes are reviewed independently from adapter implementation changes when they alter
public semantics. Adapters consume these files through test harnesses but do not rewrite them.

Canonical HTML is updated only through an explicit contract diff. Snapshot update commands must not
write into `contracts/` without a dedicated reviewed mode.

## Validation

`manifest.json` files conform to
[`component-manifest.schema.json`](./schema/component-manifest.schema.json). Case and behavior schemas
are introduced with their infrastructure roadmap items.

Repository validation eventually checks:

- directory and identifier agreement;
- JSON Schema conformance;
- paired case and canonical HTML files;
- unique IDs and valid case references;
- canonical HTML parsing;
- adapter coverage for stable cases.

Visual permutations use the shared themes and viewports in `visual.config.json`. A case can narrow or
disable its visual matrix through its optional `visual` field. Platform harnesses reuse the same
fixture ID and write snapshots below a platform directory so parity comparisons remain explicit.

Run the current package metadata, fixture, and significant DOM contract suite from the repository
root:

```bash
npm run check:ui-contracts
```
