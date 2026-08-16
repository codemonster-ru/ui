# CodeMonster UI maturity roadmap

This document continues the completed
[CodeMonster UI 1.0 roadmap](./codemonster-ui-roadmap.md). CodeMonster UI 1.0 proved the shared
contract, CSS, runtime, Vue, and Annabel Razor architecture. This roadmap closes the remaining
functional, migration, and visual-compatibility gaps before another platform adapter is scheduled.

## Scope

- Keep Vue and Annabel Razor as the active platform adapters.
- Do not schedule React or Angular without a concrete consumer and an approved scope change.
- Treat the frozen VueForge surface as migration evidence, not as an API that must be copied
  mechanically.
- Preserve the VueForge 2 visual language exactly for every migrated component and maintained
  application composition. Product renaming and cross-platform contracts do not authorize a visual
  redesign.
- Prefer native HTML and small application compositions where they provide the same stable use
  cases with less public API.
- Add a cross-platform component only when its semantic DOM, behavior, accessibility, and fallback
  rendering can be expressed without framework-specific policy.

## Target outcome

The roadmap is complete when a representative Vue application and a representative Annabel Razor
application can use CodeMonster UI for their shared design-system needs, and the Vue application can
remove `@codemonster-ru/vueforge-core` and `@codemonster-ru/vueforge-layouts` without losing any
approved stable use case or changing its VueForge 2 rendering.

Retained products such as VueForge Icons, CodeBlock, and Playground do not block that outcome.
Application-owned shells do not block it when their required recipes and migration guidance are
verified in real consumers and reproduce the frozen VueForge showcase presentation.

## Current baseline

The initial inventory on 2026-08-14 establishes the starting point; Phase 16 replaces this prose
snapshot with an enforced machine-readable coverage inventory.

| Evidence                               | Current state |
| -------------------------------------- | ------------: |
| Frozen VueForge component dispositions |            63 |
| Direct replacement dispositions        |            33 |
| Composition dispositions               |            10 |
| Manual-review dispositions             |            20 |
| CodeMonster UI contracts               |            33 |
| Public Vue components                  |            33 |
| Top-level Annabel Razor components     |            33 |

The 33 direct replacements have matching contract, Vue, and Razor names. This proves catalog
presence, not feature completeness. The current migration map does not record which VueForge props,
slots, events, interaction modes, or application use cases each replacement preserves, supersedes,
or intentionally drops.

### Frozen visual baseline

The sole visual authority is commit `fd793696f50d3be0fcd3788f0f8f751c63869963`. The baseline
includes the complete browser rendering of `examples/playground`, every stylesheet and default theme
token consumed by that application, and every component state displayed by its Core, Colors,
Layouts, Icons, CodeBlock, and Playground routes. Later commits are migration evidence only and must
not be used to update expected images.

CodeMonster UI may use different package names, selectors, component implementations, and semantic
DOM where its contracts require them. Those internal differences must not create a product-level
visual difference. Screenshot comparison may tolerate only deterministic browser rasterization noise;
the executable gate ignores at most two integer levels per RGBA channel and rejects any pixel above
that threshold. There is no design-change tolerance.

## Working rules

- Complete phases in order unless a dependency recorded below permits parallel work.
- Keep every implementation commit buildable and include its relevant tests and roadmap update.
- Reference the stable item identifier in the commit body, for example `Roadmap: CMUI-170`.
- Do not mark an item complete because component files exist on both platforms.
- Record every legacy capability as `supported`, `superseded`, `application-owned`, `retained`, or
  `missing`, with evidence for the decision.
- A `supported` capability requires tests at the appropriate contract, adapter, accessibility,
  interaction, SSR or server-rendering, and visual layers.
- A visual claim requires rendered screenshot comparison. Generating an HTML fixture matrix without
  capturing and comparing pixels is fixture coverage, not visual verification.
- Treat VueForge token source and formulas as the first visual-compatibility input. Compare token
  names, aliases, formulas, serialized values, and computed browser values before changing
  component or showcase CSS.
- Keep visual corrections in the lowest shared layer that owns the behavior: tokens in
  `ui-tokens`, component geometry and states in `ui-css` or the shared component contract, adapter
  behavior in the platform adapter, and only application-owned composition in the showcase.
- Do not accept screenshot-driven offsets, selectors, or markup changes as component fixes. A
  screenshot diff is a validation signal, not the implementation source of truth; every shared
  component change requires canonical Vue and Razor evidence before it can close a visual item.
- Use commit `fd793696f50d3be0fcd3788f0f8f751c63869963` as the frozen VueForge repository,
  showcase, token, and component-style reference. Compare equivalent routes, states, themes, and
  viewports; do not approve a new design merely because Vue and Razor match each other.
- Do not weaken canonical HTML or accessibility contracts solely to reproduce a VueForge API.
- Record material scope changes in the decision log before changing the numbered checklist.

## Progress

- Current phase: Phase 19 — VueForge visual compatibility
- Current milestone: M12 — In progress
- Completed milestones: M9, M10, and M11
- Next item: `CMUI-195` — restore direct-replacement component parity after the token graph audit

## Milestones

| Milestone | Outcome                                                                                              | Status      |
| --------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| M9        | Every frozen VueForge capability has an explicit, enforced disposition and visible catalog status    | Completed   |
| M10       | Existing direct replacements cover their approved stable use cases in Vue and Razor                  | Completed   |
| M11       | Missing portable components and recipes are delivered, and real consumers complete migration         | Completed   |
| M12       | CodeMonster UI reproduces the frozen VueForge visual language and showcase without image regressions | In progress |

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

- [x] `CMUI-177` Close Button, Card, Field, Input, and Accordion capability gaps.
- [x] `CMUI-178` Close display and native-form cohort capability gaps.
- [x] `CMUI-179` Close navigation and overlay cohort capability gaps, including keyboard, focus,
      dismissal, controlled-state, and progressive-enhancement behavior.
- [x] `CMUI-180` Close Select, DatePicker, and CommandPalette capability gaps, including native
      submission and server-rendered fallback behavior.
- [x] `CMUI-181` Close Table and DataTable capability gaps, including the approved sorting,
      pagination, selection, empty, error, and column-management use cases.
- [x] `CMUI-182` Close layout primitive gaps and verify the documented shell-composition boundary in
      both representative consumers.
- [x] `CMUI-183` Update contracts, migration transforms, documentation, and playground examples as
      each direct-replacement cohort matures.

### M10 exit gate

- [x] `CMUI-G010` Every direct replacement capability is classified with passing evidence; no
      approved stable use case remains `missing` in either active adapter.

## Phase 18 — Portable expansion and consumer migration

- [x] `CMUI-184` Re-evaluate small portable candidates currently marked `compose` or `manual`,
      starting with Fieldset, IconButton, ProgressBar, ProgressSpinner, and Tag.
- [x] `CMUI-185` Re-evaluate behavior-rich candidates only with shared Vue and Razor demand,
      including Stepper, TableOfContents, menu-bar/navigation patterns, and data-table column controls.
- [x] `CMUI-186` Implement each approved new component through contract, canonical fixtures, shared
      CSS, optional runtime, Vue adapter, Razor adapter, parity tests, documentation, and showcase.
- [x] `CMUI-187` Publish and test maintained recipes for approved compositions such as ConfirmDialog,
      FormLayout, GroupBox, Panel, PageHeader, SkeletonGate, AuthLayout, and ErrorLayout.
- [x] `CMUI-188` Keep application shells application-owned unless the reconsideration criteria in
      [Application shell ownership](./architecture/application-shell-ownership.md) are satisfied by two
      real consumers.
- [x] `CMUI-189` Migrate the representative Vue application off `vueforge-core` and
      `vueforge-layouts`; validate the representative Annabel Razor application against the same shared
      component contracts.
- [x] `CMUI-190` Run complete package, packed-consumer, SSR/server-rendering, accessibility,
      interaction, visual, migration, and real-consumer verification.
- [x] `CMUI-191` Publish the resulting stable package cohort and exact migration notes without
      unpublishing retained VueForge packages.

### M11 exit gate

- [x] `CMUI-G011` Representative Vue and Razor consumers pass, the Vue consumer no longer depends on
      `vueforge-core` or `vueforge-layouts`, and every frozen disposition has a verified destination.

## Phase 19 — VueForge visual compatibility

Phases 16–18 established functional destinations but did not prove visual compatibility. The
existing CodeMonster UI visual command validates generated fixture metadata and HTML; it does not
capture screenshots or compare them with VueForge. This phase reopens the migration release gate
for presentation while retaining the completed semantic, accessibility, and cross-platform work.

- [x] `CMUI-192` Freeze an executable reference from commit
      `fd793696f50d3be0fcd3788f0f8f751c63869963` for the VueForge Core, Colors, Layouts, Icons,
      CodeBlock, and Playground showcase routes, including the exact package styles, deterministic
      fonts, animation settings, content, data, themes, and viewport sizes. The reviewed 312-image
      baseline is stored in `visual-baselines/vueforge-showcase`.
- [x] `CMUI-193` Add a browser screenshot harness that renders frozen VueForge and current
      CodeMonster UI references side by side, stores reviewed baselines, produces image diffs, and
      fails CI above an explicitly documented anti-aliasing tolerance.
- [x] `CMUI-194` Audit and restore VueForge 2 token parity for palette, semantic colors,
      typography, control sizing, spacing, radii, borders, shadows, focus treatment, and motion
      under `--cm-*` names. Compare the frozen VueForge token source, aliases, formulas, serialized
      light/dark presets, and computed browser values; add a machine-readable parity report and
      token-package tests before changing component CSS.
- [ ] `CMUI-195` Restore default, variant, size, state, and responsive visual parity for every
      direct replacement in both light and dark themes after `CMUI-194` passes. Validate canonical
      component fixtures in Vue and Razor, repair shared contracts/CSS at the owning layer, and use
      the frozen showcase only as the final product-level gate. Do not close this item with
      showcase-specific offsets or regenerated baselines.
- [ ] `CMUI-196` Restore the frozen visual presentation for approved compositions and
      application-owned shell recipes after shared component parity is complete, while preserving
      their current semantic and accessibility ownership. Keep composition fixes separate from
      shared component and token fixes.
- [ ] `CMUI-197` Restore the complete showcase information architecture and representative example
      matrix from the frozen VueForge reference. Product names and intentional API migration notes
      may change; layout, density, component appearance, and responsive behavior may not.
- [x] `CMUI-198` Add visual regression coverage for hover, active, focus-visible, disabled, invalid,
      selected, open, loading, and indeterminate states at desktop and mobile viewports.
- [ ] `CMUI-199` Run the same reviewed visual baselines against Vue-rendered and Razor-rendered
      canonical cases so cross-platform parity cannot converge on a design that differs from
      VueForge.
- [ ] `CMUI-200` Re-run real-consumer migration and release verification, publish the visual-parity
      release, and verify that no product-level pixel differences remain.

### M12 exit gate

- [ ] `CMUI-G012` The restored showcase and all migrated visual cases pass browser screenshot
      comparison against commit `fd793696f50d3be0fcd3788f0f8f751c63869963` in light/dark and
      desktop/mobile matrices with no product-level visual differences.

## Decision log

Add decisions chronologically. Do not rewrite old entries; supersede them with a new entry.

| Date       | Decision                                                                                          | Reason                                                                                                                                                                                                                                                  | Affected items                     |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 2026-08-14 | Mature Vue and Annabel Razor before scheduling React or Angular.                                  | Validate the cross-platform model and close known migration gaps with the two active consumers before multiplying adapter work.                                                                                                                         | All                                |
| 2026-08-14 | Separate catalog presence from capability parity.                                                 | Matching component names and files do not prove that stable VueForge use cases survived migration.                                                                                                                                                      | `CMUI-170`–`CMUI-183`              |
| 2026-08-14 | Make unresolved migration gaps visible in the playground.                                         | The 1.0 example migration removed much of the old showcase and made omitted functionality look deleted or completed.                                                                                                                                    | `CMUI-174`                         |
| 2026-08-14 | Keep DataTable scalar and assign rich rendering and advanced-grid policy to applications.         | Vue callbacks and trusted rich content do not form a safe Razor data contract; representative demand is satisfied by portable pagination, selection, ordered visibility, and localization plus explicit CmTable composition.                            | `CMUI-181`                         |
| 2026-08-14 | Use adapter-native trusted slots for portable authored content.                                   | Input adornments and Accordion item content need rich composition in Vue and Razor without coupling the contract to the VueForge icon registry or accepting untrusted strings as markup.                                                                | `CMUI-177`                         |
| 2026-08-15 | Keep navigation and overlay semantics component-owned while allowing trusted content inside them. | Owned buttons, menu items, tab panels, headings, and deterministic ARIA relationships preserve Vue/Razor parity; arbitrary trigger roots and external panels would move accessibility ownership back to consumers.                                      | `CMUI-179`                         |
| 2026-08-15 | Keep advanced inputs native-first and bound rich content to component-owned structures.           | Native Select and DatePicker controls preserve submission and validation while localized clear actions enhance them; typed CommandPalette states and trusted inner regions add async composition without exposing arbitrary result or dialog ownership. | `CMUI-180`                         |
| 2026-08-15 | Verify primitives independently from application-shell migration.                                 | All five primitives have Vue composition evidence and Container/Stack have real Razor demand; routing, landmarks, responsive state, theme bootstrap, and legacy shell removal remain application work under CMUI-187–189.                               | `CMUI-182`                         |
| 2026-08-15 | Enforce direct-replacement maturity separately from the capability audit.                         | Completing classification did not mean all approved gaps were delivered; a dedicated machine gate now prevents direct replacements from returning to missing or pending after M10.                                                                      | `CMUI-183`, `CMUI-G010`            |
| 2026-08-15 | Approve four finite semantic components and supersede Tag with Badge.                             | Fieldset, IconButton, ProgressBar, and ProgressSpinner have bounded Vue/Razor contracts and real composition demand; Tag adds only an unrequested outlined presentation over Badge.                                                                     | `CMUI-184`, `CMUI-186`             |
| 2026-08-15 | Keep behavior-rich candidates application-owned without shared demand.                            | Column chooser persistence, command navigation, navigation trees, workflow steps, and document observation all combine static semantic composition with product policy; none has matching Razor demand.                                                 | `CMUI-185`                         |
| 2026-08-15 | Re-verify application shell ownership after portable delivery.                                    | The real Vue consumers own different shell policies, the real Razor consumer has no matching shell demand, and native landmarks plus primitives remain smaller than a speculative cross-platform shell API.                                             | `CMUI-188`                         |
| 2026-08-15 | Remove direct legacy design-system ownership from the representative Vue playground.              | Native landmarks, maintained recipes, CodeMonster UI tokens/CSS, and an application-owned theme bootstrap preserve the approved use cases; retained Icons, CodeBlock, and Playground products keep only their explicit side-by-side hooks.              | `CMUI-189`                         |
| 2026-08-15 | Publish the matured cohort with independent package versions while retaining VueForge products.   | The verified cohort is available as npm patch and minor releases plus `codemonster-ru/ui-razor@1.1.0`; exact install and migration notes are published, while retained VueForge releases remain available.                                              | `CMUI-191`, `CMUI-G011`            |
| 2026-08-15 | Reopen migration completion for VueForge 2 visual compatibility.                                  | The replacement changed showcase content, shell geometry, component spacing, typography, focus treatment, and other presentation while the existing visual gate only generated fixtures and never compared screenshots.                                 | `CMUI-192`–`CMUI-200`, `CMUI-G012` |
| 2026-08-15 | Use `fd793696f50d3be0fcd3788f0f8f751c63869963` as the sole visual baseline.                       | This is the last accepted showcase before the substantial monorepository and package migration; later commits cannot define expected presentation even when their relevant files happen to match.                                                       | `CMUI-192`–`CMUI-200`, `CMUI-G012` |
| 2026-08-15 | Preserve frozen token alias formulas as well as their computed values.                            | Equivalent literals can hide semantic drift in derived radii and shadows; the portable `--cm-*` graph now retains the reviewed VueForge relationships and verifies every reference.                                                                     | `CMUI-194`                         |
| 2026-08-15 | Preserve canonical ownership while matching direct-replacement pixels.                            | All 37 direct replacements retain their current Vue/Razor semantics and public contracts while the reviewed showcase comparison passes all 312 light/dark desktop/mobile screenshots with no changed, missing, or unexpected images.                    | `CMUI-195`                         |
| 2026-08-15 | Compare interaction states against the frozen showcase, not against a regenerated current run.    | The reviewed 44-image state baseline comes from the detached `fd793696` worktree and covers hover, active, focus-visible, disabled, invalid, selected, open, loading, indeterminate, and reduced-motion cases in both themes and viewports.             | `CMUI-198`                         |
| 2026-08-16 | Reopen token, component, and composition parity in dependency order.                                | The current 312-image comparison still reports 62 changed screenshots, so the earlier completion claims for CMUI-194–196 are not release evidence. Audit the frozen token graph first, then repair shared component layers, then repair application-owned composition. | `CMUI-194`–`CMUI-196` |
| 2026-08-16 | Treat screenshot diffs as validation rather than implementation guidance.                          | Local showcase offsets can reduce one screenshot cluster while introducing cross-viewport or cross-platform drift; shared Vue/Razor evidence must establish the owning layer before a visual change is accepted. | `CMUI-194`–`CMUI-199` |
| 2026-08-16 | Restore the frozen token aliases and formulas in the portable `--cm-*` graph.                       | The audit found three control aliases pointing directly at scale tokens and nine missing typography role aliases; restoring the VueForge relationships keeps serialized and computed values stable for Vue and Razor. | `CMUI-194` |
| 2026-08-16 | Keep approved composition repairs in application-owned recipes.                                    | The GroupBox replacement now matches the frozen intrinsic trigger geometry and transparent treatment through its recipe CSS; a 312-state recapture changed only the expected GroupBox screenshots, with no token or shared-component changes. | `CMUI-196` |

## Scope-change log

Record additions, removals, splits, and reordered dependencies before editing the numbered
checklist.

| Date       | Change                                                          | Reason                                                                                     | Decision reference                       |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 2026-08-14 | Added the post-1.0 maturity sequence for Vue and Annabel Razor. | Continue the original multi-platform goal after the minimum viable cross-platform release. | 2026-08-14 maturity decision             |
| 2026-08-15 | Added Phase 19 and M12 for exact VueForge visual compatibility. | Functional and adapter parity did not preserve the approved VueForge presentation.         | 2026-08-15 visual compatibility decision |
