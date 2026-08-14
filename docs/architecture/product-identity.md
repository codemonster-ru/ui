# CodeMonster UI product identity

Status: Accepted  
Date: 2026-08-11  
Amended: 2026-08-14
Roadmap items: `CMUI-001`, `CMUI-165`

## Decision

The cross-platform design system is named **CodeMonster UI**. Its canonical GitHub repository is
`codemonster-ru/ui`. The Annabel Razor Composer split is `codemonster-ru/ui-razor`.

CodeMonster UI is the umbrella product for the shared design foundation and its supported platform
adapters. It is not named after Vue, React, Angular, Annabel, or another rendering technology.

## Naming usage

Use `CodeMonster UI` in product names, documentation headings, and prose. Use `ui` for the main
repository slug and `ui-razor` for the Razor-only split.

Do not introduce alternative short product names until there is a concrete naming requirement. The
distribution names and technical prefixes are defined by
[CodeMonster UI naming and prefixes](./naming-and-prefixes.md).

## Repository transition

The repository first moved from `codemonster-ru/vueforge` to `codemonster-ru/codemonster-ui` after
the 1.0 migration gates passed. The final topology removes the organization-name repetition:
`codemonster-ru/ui` owns the monorepo, while `codemonster-ru/ui-razor` owns the read-only Composer
split. Existing published VueForge packages retain their package names and identities under the
approved migration policy.

## Rationale

- The name describes a UI system without coupling it to a rendering platform.
- It extends the existing CodeMonster organization and product identity.
- It supports npm, Composer, CSS-only, and future platform adapters under one product.
- The repository paths remain concise inside the existing CodeMonster organization.

## Consequences

- New architecture documents use CodeMonster UI as the product name.
- New framework-independent work must not use VueForge as its public product identity.
- The repository uses the platform-neutral slug; published VueForge packages retain their names.
- Package and code prefixes follow the approved naming and prefixes decision.
