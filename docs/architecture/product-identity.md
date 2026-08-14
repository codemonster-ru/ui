# CodeMonster UI product identity

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-001`

## Decision

The cross-platform design system is named **CodeMonster UI**. The target GitHub repository name is
`codemonster-ui`, under the existing `codemonster-ru` organization.

CodeMonster UI is the umbrella product for the shared design foundation and its supported platform
adapters. It is not named after Vue, React, Angular, Annabel, or another rendering technology.

## Naming usage

Use `CodeMonster UI` in product names, documentation headings, and prose. Use `codemonster-ui` where
a lowercase repository or project slug is required.

Do not introduce alternative short product names until there is a concrete naming requirement. The
distribution names and technical prefixes are defined by
[CodeMonster UI naming and prefixes](./naming-and-prefixes.md).

## Repository transition

The repository was renamed from `codemonster-ru/vueforge` to
`codemonster-ru/codemonster-ui` on 2026-08-14, after CodeMonster UI 1.0 and the VueForge migration
requirements passed. GitHub preserves the old repository URL as a redirect. Existing published
VueForge packages retain their package names and identities under the approved migration policy.

## Rationale

- The name describes a UI system without coupling it to a rendering platform.
- It extends the existing CodeMonster organization and product identity.
- It supports npm, Composer, CSS-only, and future platform adapters under one product.
- The repository slug is direct, predictable, and consistent with the product name.

## Consequences

- New architecture documents use CodeMonster UI as the product name.
- New framework-independent work must not use VueForge as its public product identity.
- The repository uses the platform-neutral slug; published VueForge packages retain their names.
- Package and code prefixes follow the approved naming and prefixes decision.
