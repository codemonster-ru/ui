# VueForge migration policy

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-014`

## Decision

CodeMonster UI is a new cross-platform package line, not an in-place rename of published VueForge
packages. VueForge remains installable and maintained during migration. Its packages are deprecated
only after replacement packages, migration tooling, documentation, and real consumer validation are
complete.

New CodeMonster UI packages do not expose VueForge names, selectors, custom properties, or wrapper
APIs solely for backward compatibility.

## Why a new package line

The product boundary changes substantially:

- Vue components stop owning component semantics;
- CSS and tokens become first-class framework-independent distributions;
- React, Angular, and Annabel Razor become supported adapters;
- canonical HTML and behavior contracts become release artifacts;
- package dependencies and names change.

Publishing these changes as ordinary new versions under Vue-specific names would misrepresent the
product and make incremental migration harder to reason about.

## Package mapping

| VueForge source | CodeMonster UI destination | Notes |
| --- | --- | --- |
| `vueforge-theme` | `ui-tokens` | Port framework-independent token and theme ownership |
| Core component CSS | `ui-css` | Rename to `cm` contracts without `vf` aliases |
| `vueforge-core` Vue components | `ui-vue` | Reimplement against approved contracts |
| `vueforge-layouts` | `ui-css` and `ui-vue` | Split styling from Vue rendering where justified |
| `vueforge-icons` catalog | `ui-icons` | Separate icon data from platform renderers |
| `vueforge-icons` Vue component | `ui-vue` | Use the shared icon catalog |
| VueForge browser behavior | `ui-runtime` where applicable | Only progressive, framework-independent controllers |
| `vueforge-codeblock` | Deferred to `CMUI-147` | Review as a composed product |
| Playground packages | Deferred to `CMUI-148` | Review separately from design-system foundations |

The mapping is architectural, not a requirement to copy every existing public API. Each component
or package is reviewed before migration.

## VueForge lifecycle

### Migration development

Until `CMUI-149` freezes the final feature baseline:

- complete already accepted VueForge release work;
- accept security, correctness, accessibility, and supported-consumer fixes;
- avoid new architecture that conflicts with the CodeMonster UI direction;
- build new cross-platform components in CodeMonster UI contracts and packages;
- do not remove existing VueForge APIs merely because a replacement is being developed.

### Maintenance

After CodeMonster UI replacements are stable and the baseline is frozen:

- VueForge receives critical security and correctness fixes;
- no new component families or design-system foundations are added;
- documentation points new development to CodeMonster UI;
- supported migration tooling and package mapping remain available.

### Deprecation

An npm package may be deprecated only when all applicable conditions hold:

1. CodeMonster UI 1.0 is published;
2. its supported replacement covers the documented stable use cases;
3. the real Vue admin application has migrated successfully;
4. packed registry consumers and migration tooling pass;
5. migration documentation names the exact replacement and required action;
6. no unresolved critical regression blocks migration.

Deprecation messages identify a verified replacement version. Published VueForge versions are not
unpublished as the normal migration mechanism.

## Consumer migration

Applications migrate deliberately by package or component cohort:

1. install the required CodeMonster UI packages;
2. add `cm` tokens and shared CSS at an explicit application boundary;
3. migrate component imports and markup;
4. migrate theme customization from `vf` to `cm` tokens;
5. verify DOM, accessibility, visual output, SSR, and application behavior;
6. remove the replaced VueForge package or stylesheet when no consumer remains.

Temporary side-by-side usage is allowed because `vf` and `cm` selectors are namespaced. It is a
migration state, not a permanent compatibility architecture.

## Compatibility policy

- Do not ship duplicate `.vf-*` selectors in `ui-css`.
- Do not emit both `--vf-*` and `--cm-*` variables from new token packages.
- Do not export `Vf*` aliases from platform adapters.
- Do not make new adapters depend on VueForge packages.
- Do not preserve obsolete API shapes that conflict with canonical HTML or accessibility.
- Add a migration transform only when the change is deterministic and safe.
- Report semantic migrations for manual review instead of guessing.

An application-owned temporary compatibility stylesheet is allowed when needed for staged migration,
but it is not published as a permanent CodeMonster UI runtime dependency.

## Tooling and documentation

Before deprecation, the repository provides:

- a package and component mapping reference;
- a read-only migration checker;
- deterministic codemods for approved imports, component names, classes, and custom properties;
- reports for theme and semantic changes requiring manual judgment;
- side-by-side Vue examples where migration is non-trivial;
- a complete migration verification checklist.

Migration tools default to read-only reporting and require an explicit write flag.

## Repository transition

Development continues in the existing Git history and integration branch. Renaming the GitHub
repository is the final `CMUI-164` transition after release and migration gates pass. Package
repository metadata changes only when the target repository exists and redirects are verified.

## Consequences

- Existing consumers are not forced onto an incomplete cross-platform rewrite.
- New packages begin with a small clean API and one `cm` contract.
- Temporary coexistence supports gradual CMS admin migration without becoming permanent baggage.
- VueForge retirement is based on verified replacements and real consumers rather than a date alone.
