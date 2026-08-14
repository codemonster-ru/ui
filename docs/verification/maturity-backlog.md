# CodeMonster UI ordered maturity backlog

Status: Complete
Date: 2026-08-14
Completed: 2026-08-15
Roadmap item: `CMUI-176`

The canonical backlog is
[`migration/codemonster-ui-maturity-backlog.json`](../../migration/codemonster-ui-maturity-backlog.json).
It now records no unresolved coverage gaps. Its preserved order reflects the consumer evidence from
[`CMUI-175`](./consumer-usage-inventory.md), and the coverage gate requires any future missing
capability to appear exactly once with the same roadmap assignment.

## Execution order

| Order | Item       | Priority | Destination       | Outcome                                                          | Gap count |
| ----: | ---------- | -------- | ----------------- | ---------------------------------------------------------------- | --------: |
|     1 | `CMUI-181` | P0       | Phase 17          | Portable DataTable controls and explicit advanced-grid ownership |         0 |
|     2 | `CMUI-177` | P0       | Phase 17          | Foundation cohort content and input affordances delivered        |         0 |
|     3 | `CMUI-178` | P1       | Phase 17          | Display and native-form cohort maturity delivered                |         0 |
|     4 | `CMUI-179` | P1       | Phase 17          | Navigation and overlay composition maturity delivered            |         0 |
|     5 | `CMUI-180` | P1       | Phase 17          | Advanced input and server-rendered fallback maturity delivered   |         0 |
|     6 | `CMUI-182` | P1       | Phase 17          | Layout primitives and shell ownership verified                   |         0 |
|     7 | `CMUI-183` | P1       | Phase 17          | Direct-replacement evidence synchronized                         |         0 |
|     8 | `CMUI-184` | P1       | Phase 18          | Small portable candidate decisions complete                      |         0 |
|     9 | `CMUI-185` | P2       | Phase 18          | Behavior-rich candidate decisions complete                       |         0 |
|    10 | `CMUI-186` | P2       | Phase 18          | Approved small portable components delivered                     |         0 |
|    11 | `CMUI-187` | P0       | Recipe            | Maintained application composition recipes published             |         0 |
|    12 | `CMUI-188` | P0       | Application-owned | Application shell ownership verified                             |         0 |
|    13 | `CMUI-189` | P0       | Phase 18          | Playground legacy design-system dependencies removed             |         0 |
|    14 | `CMUI-190` | P0       | Phase 18          | Complete parity and real-consumer verification passed            |         0 |
|    15 | `CMUI-191` | P1       | Phase 18          | Matured cohort and exact migration notes published               |         0 |

Priority expresses consumer impact inside the dependency order; it does not permit Phase 18
implementation to bypass the M10 exit gate. `CMUI-183` is listed once but runs alongside every
Phase 17 cohort. Candidate implementation in `CMUI-186` is conditional: rejected candidates close
their gap through an explicit superseded, application-owned, or retained decision instead.

## Consumer-driven decisions

- DataTable moved first because the real Annabel Vue admin owns pagination and column controls.
  The shared scalar contract now covers those controls; rich rendering and advanced grid policy
  remain application-owned.
- Theme and SkeletonGate recipes are P0 because they block removal of the playground's legacy
  runtime. The remaining recipe set is backed by real Vue application compositions.
- Menubar, Stepper, TableOfContents, and navigation-tree expansion remain P2 because current Razor
  usage does not establish two-platform demand.
- Container, Stack, and Card require regression protection rather than expansion because they are
  the only components currently exercised by the real Razor page.
- VueForge Icons, CodeBlock, and the three-package Playground family remain explicitly retained
  products. Their imports do not block removal of `vueforge-core` and `vueforge-layouts`.

## Completion rule

A backlog item closes only when each assigned gap changes from `missing` to an evidence-backed final
status, or when its non-gap verification and migration outcome passes. Removing a gap from the
coverage inventory or changing its roadmap assignment without updating this backlog fails the
coverage gate.

All 15 ordered items are complete, and the canonical coverage inventory records no unresolved
gaps.
