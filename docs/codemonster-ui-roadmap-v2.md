# CodeMonster UI maturity roadmap

This document continues the completed
[CodeMonster UI 1.0 roadmap](./codemonster-ui-roadmap.md). CodeMonster UI 1.0 proved the shared
contract, CSS, runtime, Vue, and Annabel Razor architecture. This roadmap closes the remaining
functional and migration gaps before another platform adapter is scheduled.

## Scope

- Keep Vue and Annabel Razor as the active platform adapters.
- Do not schedule React or Angular without a concrete consumer and an approved scope change.
- Treat the frozen VueForge surface as migration evidence, not as an API that must be copied
  mechanically.
- Prefer native HTML and small application compositions where they provide the same stable use
  cases with less public API.
- Add a cross-platform component only when its semantic DOM, behavior, accessibility, and fallback
  rendering can be expressed without framework-specific policy.

## Target outcome

The roadmap is complete when a representative Vue application and a representative Annabel Razor
application can use CodeMonster UI for their shared design-system needs, and the Vue application can
remove `@codemonster-ru/vueforge-core` and `@codemonster-ru/vueforge-layouts` without losing any
approved stable use case.

Retained products such as VueForge Icons, CodeBlock, and Playground do not block that outcome.
Application-owned shells do not block it when their required recipes and migration guidance are
verified in real consumers.

## Current baseline

The initial inventory on 2026-08-14 establishes the starting point; Phase 16 replaces this prose
snapshot with an enforced machine-readable coverage inventory.

| Evidence | Current state |
| --- | ---: |
| Frozen VueForge component dispositions | 63 |
| Direct replacement dispositions | 33 |
| Composition dispositions | 10 |
| Manual-review dispositions | 20 |
| CodeMonster UI contracts | 33 |
| Public Vue components | 33 |
| Top-level Annabel Razor components | 33 |

The 33 direct replacements have matching contract, Vue, and Razor names. This proves catalog
presence, not feature completeness. The current migration map does not record which VueForge props,
slots, events, interaction modes, or application use cases each replacement preserves, supersedes,
or intentionally drops.

## Working rules

- Complete phases in order unless a dependency recorded below permits parallel work.
- Keep every implementation commit buildable and include its relevant tests and roadmap update.
- Reference the stable item identifier in the commit body, for example `Roadmap: CMUI-170`.
- Do not mark an item complete because component files exist on both platforms.
- Record every legacy capability as `supported`, `superseded`, `application-owned`, `retained`, or
  `missing`, with evidence for the decision.
- A `supported` capability requires tests at the appropriate contract, adapter, accessibility,
  interaction, SSR or server-rendering, and visual layers.
- Do not weaken canonical HTML or accessibility contracts solely to reproduce a VueForge API.
- Record material scope changes in the decision log before changing the numbered checklist.

## Progress

- Current phase: Phase 17 — Direct replacement maturity
- Current milestone: M10 — Mature direct replacements
- Next item: `CMUI-181` Mature DataTable from real-consumer demand.

## Milestones

| Milestone | Outcome | Status |
| --- | --- | --- |
| M9 | Every frozen VueForge capability has an explicit, enforced disposition and visible catalog status | Completed |
| M10 | Existing direct replacements cover their approved stable use cases in Vue and Razor | In progress |
| M11 | Missing portable components and recipes are delivered, and real consumers complete migration | Pending |

## Phase 16 — Coverage truth and restored catalog

- [x] `CMUI-170` Define a machine-readable migration coverage inventory keyed by VueForge public
  component and capability.
- [x] `CMUI-171` Add a coverage validator that reconciles the inventory with the frozen baseline,
  migration map, contracts, Vue exports, Razor provider registrations, documentation, and showcase.
- [x] `CMUI-172` Audit the 33 direct replacements against frozen VueForge types, documentation,
  tests, and representative examples; classify every material capability.
- [x] `CMUI-173` Audit all `compose` and `manual` dispositions and record the evidence for keeping,
  changing, or splitting each decision.
- [x] `CMUI-174` Restore a complete CodeMonster UI catalog in the playground: every stable component
  must have a discoverable example, and unresolved migration gaps must be visible rather than
  silently omitted.
- [x] `CMUI-175` Inventory actual `vueforge-core` and `vueforge-layouts` usage in the representative
  Vue consumer and actual shared-UI needs in the Annabel Razor consumer.
- [x] `CMUI-176` Publish the ordered maturity backlog from coverage gaps and real-consumer demand;
  assign each gap to Phase 17, Phase 18, an application recipe, or an explicitly retained product.

### M9 exit gate

- [x] `CMUI-G009` Coverage validation fails for an unclassified baseline capability, an adapter or
  contract missing from the catalog, and a stable component missing from the showcase.

## Phase 17 — Direct replacement maturity

Work in this phase is driven by the inventory from `CMUI-172`. A cohort is complete only when its
approved stable use cases work in both Vue and Razor; identical framework APIs are not required.

- [ ] `CMUI-177` Close Button, Card, Field, Input, and Accordion capability gaps.
- [ ] `CMUI-178` Close display and native-form cohort capability gaps.
- [ ] `CMUI-179` Close navigation and overlay cohort capability gaps, including keyboard, focus,
  dismissal, controlled-state, and progressive-enhancement behavior.
- [ ] `CMUI-180` Close Select, DatePicker, and CommandPalette capability gaps, including native
  submission and server-rendered fallback behavior.
- [ ] `CMUI-181` Close Table and DataTable capability gaps, including the approved sorting,
  pagination, selection, empty, error, and column-management use cases.
- [ ] `CMUI-182` Close layout primitive gaps and verify the documented shell-composition boundary in
  both representative consumers.
- [ ] `CMUI-183` Update contracts, migration transforms, documentation, and playground examples as
  each direct-replacement cohort matures.

### M10 exit gate

- [ ] `CMUI-G010` Every direct replacement capability is classified with passing evidence; no
  approved stable use case remains `missing` in either active adapter.

## Phase 18 — Portable expansion and consumer migration

- [ ] `CMUI-184` Re-evaluate small portable candidates currently marked `compose` or `manual`,
  starting with Fieldset, IconButton, ProgressBar, ProgressSpinner, and Tag.
- [ ] `CMUI-185` Re-evaluate behavior-rich candidates only with shared Vue and Razor demand,
  including Stepper, TableOfContents, menu-bar/navigation patterns, and data-table column controls.
- [ ] `CMUI-186` Implement each approved new component through contract, canonical fixtures, shared
  CSS, optional runtime, Vue adapter, Razor adapter, parity tests, documentation, and showcase.
- [ ] `CMUI-187` Publish and test maintained recipes for approved compositions such as ConfirmDialog,
  FormLayout, GroupBox, Panel, PageHeader, SkeletonGate, AuthLayout, and ErrorLayout.
- [ ] `CMUI-188` Keep application shells application-owned unless the reconsideration criteria in
  [Application shell ownership](./architecture/application-shell-ownership.md) are satisfied by two
  real consumers.
- [ ] `CMUI-189` Migrate the representative Vue application off `vueforge-core` and
  `vueforge-layouts`; validate the representative Annabel Razor application against the same shared
  component contracts.
- [ ] `CMUI-190` Run complete package, packed-consumer, SSR/server-rendering, accessibility,
  interaction, visual, migration, and real-consumer verification.
- [ ] `CMUI-191` Publish the resulting stable package cohort and exact migration notes without
  unpublishing retained VueForge packages.

### M11 exit gate

- [ ] `CMUI-G011` Representative Vue and Razor consumers pass, the Vue consumer no longer depends on
  `vueforge-core` or `vueforge-layouts`, and every frozen disposition has a verified destination.

## Decision log

Add decisions chronologically. Do not rewrite old entries; supersede them with a new entry.

| Date | Decision | Reason | Affected items |
| --- | --- | --- | --- |
| 2026-08-14 | Mature Vue and Annabel Razor before scheduling React or Angular. | Validate the cross-platform model and close known migration gaps with the two active consumers before multiplying adapter work. | All |
| 2026-08-14 | Separate catalog presence from capability parity. | Matching component names and files do not prove that stable VueForge use cases survived migration. | `CMUI-170`–`CMUI-183` |
| 2026-08-14 | Make unresolved migration gaps visible in the playground. | The 1.0 example migration removed much of the old showcase and made omitted functionality look deleted or completed. | `CMUI-174` |

## Scope-change log

Record additions, removals, splits, and reordered dependencies before editing the numbered
checklist.

| Date | Change | Reason | Decision reference |
| --- | --- | --- | --- |
| 2026-08-14 | Added the post-1.0 maturity sequence for Vue and Annabel Razor. | Continue the original multi-platform goal after the minimum viable cross-platform release. | 2026-08-14 maturity decision |
