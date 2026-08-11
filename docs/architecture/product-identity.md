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
package, CSS, custom-property, and component prefixes are decided separately by `CMUI-002`.

## Repository transition

The current repository remains `vueforge` during development and migration. Renaming it before the
new packages and consumer migration are ready would break repository metadata and documentation
without providing architectural value.

The repository rename is gated by `CMUI-164`, after CodeMonster UI 1.0 and the VueForge migration
requirements have passed. Existing published VueForge packages retain their current identities
until the migration policy is approved by `CMUI-014`.

## Rationale

- The name describes a UI system without coupling it to a rendering platform.
- It extends the existing CodeMonster organization and product identity.
- It supports npm, Composer, CSS-only, and future platform adapters under one product.
- The repository slug is direct, predictable, and consistent with the product name.

## Consequences

- New architecture documents use CodeMonster UI as the product name.
- New framework-independent work must not use VueForge as its public product identity.
- The current repository and published packages are not renamed as part of this decision.
- Package and code prefixes remain provisional until `CMUI-002` is approved.
