# CodeMonster UI compose and manual disposition audit

Status: Complete
Date: 2026-08-14
Roadmap item: `CMUI-173`

## Purpose

This audit reviews the 10 `compose` and 20 `manual` component decisions in the frozen VueForge
migration map. It records whether each decision should remain application-owned, become a maintained
recipe, be reconsidered as a portable component, or be split because CodeMonster UI already covers
only part of the legacy use case.

The audit does not add public components or rewrite the migration map. Candidate promotion requires
the contract and real-consumer evidence gates in Phase 18 of the
[maturity roadmap](../codemonster-ui-roadmap-v2.md).

## Evidence and method

The review used the frozen public API and feature documentation, legacy implementation tests,
current CodeMonster UI contracts and adapters, the direct-replacement
[capability audit](./component-capability-audit.md), and the accepted
[application shell ownership decision](../architecture/application-shell-ownership.md).

The outcomes mean:

- **Keep composition**: the use case should remain a documented combination of semantic HTML,
  primitives, and stable components.
- **Portable candidate**: the use case has a plausible framework-independent contract, but still
  needs prioritization and complete Vue/Razor delivery.
- **Split**: part of the use case already has a destination while another material part needs a
  recipe, application integration, or candidate component.
- **Application-owned**: routing, authorization, landmarks, measurements, or workflow policy makes
  a shared adapter API inappropriate without new evidence.
- **No standalone replacement**: semantic HTML and existing primitives fully replace the wrapper's
  design-system responsibility.

## Compose dispositions

| VueForge API | Audit outcome | Reason | Required follow-up |
| --- | --- | --- | --- |
| `VfConfirmDialog` | Keep composition | Confirmation policy is a small composition of Dialog and Buttons; the application owns the destructive action, async request, and close decision | Publish a maintained recipe covering focus, loading lock, confirm, and cancel in `CMUI-187` |
| `VfFieldset` | Portable candidate | Native `fieldset`/`legend`, shared description/error IDs, invalid state, and scoped metadata form a small cross-platform accessibility contract not provided by Stack | Re-evaluate and, if approved, implement through `CMUI-184`/`CMUI-186` |
| `VfFormLayout` | Keep composition | Stacked/horizontal/responsive arrangement is layout policy expressible with Stack, Grid, CSS, and semantic form markup | Publish a maintained recipe in `CMUI-187` |
| `VfGroupBox` | Split | Static grouping belongs with the Fieldset candidate; collapsible fieldset behavior can compose Fieldset and Accordion once rich content is available | Publish a recipe in `CMUI-187`, dependent on the approved Fieldset and Accordion outcomes |
| `VfIconButton` | Portable candidate | Icon-only geometry and mandatory accessible naming are reusable across Vue and Razor; plain Button composition does not currently provide the square control contract | Re-evaluate and, if approved, implement through `CMUI-184`/`CMUI-186`; icon assets remain separately owned |
| `VfPanel` | Keep composition | Card and Section cover the surface, heading, header action, and content structure without another permanent wrapper | Publish subtle/default panel recipes in `CMUI-187` |
| `VfPageHeader` | Keep composition | Heading level, breadcrumbs, description, and actions remain semantic page composition using Stack, Inline, and Breadcrumbs | Publish a maintained recipe in `CMUI-187` |
| `VfSkeletonGate` | Split | Busy/inert placeholder composition is portable, while preserving measured previous height is DOM lifecycle policy | Publish the portable recipe in `CMUI-187`; keep measurement behavior application-owned unless two adapters need it |
| `VfAuthLayout` | Keep composition | Branding, heading, form surface, and secondary links are product content arranged with semantic landmarks and layout primitives | Publish a maintained recipe in `CMUI-187` |
| `VfErrorLayout` | Keep composition | Error code, message, and recovery actions are product copy and semantic composition rather than component behavior | Publish a maintained recipe in `CMUI-187` |

## Manual dispositions

| VueForge API | Audit outcome | Reason | Required follow-up |
| --- | --- | --- | --- |
| `VfDataTableColumnChooser` | Portable candidate | Required columns, ordered visibility state, aggregate selection, and an accessible trigger can be expressed for both adapters, but depend on the DataTable column-visibility contract | Re-evaluate with DataTable demand in `CMUI-185` and implement only after `CMUI-181` defines column ownership |
| `VfMenuBar` | Portable candidate | Nested menubar semantics and two-axis keyboard navigation are portable behavior, but current consumers and Razor demand are not yet established | Re-evaluate in `CMUI-185` |
| `VfMenuItem` | Superseded by collection | CmMenu covers action/link states, rich item content, safe link metadata, and selection while retaining item semantics inside one portable collection | No standalone item component is required |
| `VfNavMenu` | Split | Routing, authorization, active location, and compact sidebar policy are application-owned; a generic nested disclosure navigation pattern may still be portable | Re-evaluate only the portable tree behavior in `CMUI-185` |
| `VfProgressBar` | Portable candidate | Determinate/indeterminate progress semantics, bounded values, labels, tones, and reduced motion form a small framework-independent contract | Re-evaluate and, if approved, implement through `CMUI-184`/`CMUI-186` |
| `VfProgressSpinner` | Portable candidate | An indeterminate labelled progress indicator has stable semantic HTML and no framework lifecycle requirement | Re-evaluate and, if approved, implement through `CMUI-184`/`CMUI-186` |
| `VfStepper` | Portable candidate | Ordered step state, orientation, current-step semantics, disabled steps, and roving keyboard behavior are portable, but workflow navigation ownership needs real-consumer validation | Re-evaluate in `CMUI-185` |
| `VfTableOfContents` | Portable candidate | Semantic navigation, active location, levels, and links are portable; heading discovery, scroll observation, smooth scrolling, and offsets may remain application-owned | Re-evaluate the static and enhanced layers separately in `CMUI-185` |
| `VfThemeSwitch` | Application-owned | Theme preference, persistence, system-mode policy, initial SSR attributes, and mutation ownership belong to application bootstrap; Switch or Button supplies the control | Publish a Vue/Razor application recipe in `CMUI-187` rather than a shared stateful component |
| `VfTag` | Split | Badge already covers the non-interactive status/category semantics and tones; the outlined Tag appearance remains a distinct visual question | Re-evaluate the distinct visual contract in `CMUI-184`; otherwise migrate to Badge |
| `VfAppShell` | Application-owned | Responsive landmarks, sticky measured offsets, navigation state, and optional regions depend on the surrounding application | Keep manual composition under the shell ADR and `CMUI-188` |
| `VfAdminLayout` | Application-owned | Routing, authorization, collapse/preview behavior, mobile drawer state, focus restoration, and commands are admin-application policy | Keep manual composition under the shell ADR and `CMUI-188` |
| `VfAdminShell` | Application-owned | Global topbar, brand, navigation, workspace, and footer structure encode product information architecture | Keep manual composition under the shell ADR and `CMUI-188` |
| `VfDocumentLayout` | Application-owned | Documentation rails, sticky measurements, edge treatment, and optional regions are documentation-site policy | Keep documentation-site composition under the shell ADR and `CMUI-188` |
| `VfSetupLayout` | Application-owned | Enter/Escape workflow commands, validation sequencing, step navigation, and responsive regions belong to the setup application | Keep manual workflow composition under the shell ADR and `CMUI-188` |
| `VfHeaderArea` | No standalone replacement | Native `header`, application sticky CSS, and layout primitives cover the wrapper | Document as shell-internal migration guidance; no component contract |
| `VfSidebarArea` | No standalone replacement | Native `aside`, Section, and application appearance CSS cover the wrapper | Document as shell-internal migration guidance; no component contract |
| `VfContentArea` | No standalone replacement | Native `main`, Container/Section, and spacing utilities cover the wrapper | Document as shell-internal migration guidance; no component contract |
| `VfAsideArea` | No standalone replacement | Native `aside`, Section, and application appearance CSS cover the wrapper | Document as shell-internal migration guidance; no component contract |
| `VfFooterArea` | No standalone replacement | Native `footer` and layout primitives cover the wrapper | Document as shell-internal migration guidance; no component contract |

## CMUI-184 follow-up decision

Date: 2026-08-15

Status: Approved

`CMUI-184` re-evaluated the five small candidates from the original `CMUI-173` audit. The table
below is an append-only follow-up: it does not rewrite the historical candidate classifications
above. An approved boundary remains a missing delivery until its contract, CSS, Vue adapter,
Annabel Razor adapter, tests, documentation, and showcase land through `CMUI-186`.

| VueForge API | Final decision | Approved portable boundary | Destination and exclusions |
| --- | --- | --- | --- |
| `VfFieldset` | Approve with API split | A named native `fieldset`/`legend` group with a caller-owned stable id, escaped fallback label, description and error content, deterministic relationships, invalid state, trusted regions, and forwarded root attributes | Implement `CmFieldset` in `CMUI-186`. Do not preserve generated ids, unnamed group policy, or Vue-only scoped metadata. A single-control error wrapper should use `CmField`; static `VfGroupBox` grouping can migrate to Fieldset, while collapsible behavior remains a Fieldset and Accordion recipe. |
| `VfIconButton` | Approve with asset split | A square native action button with a required accessible label, trusted decorative icon content, the shared `sm`/`md`/`lg` sizes and approved Button variants, native disabled/type behavior, and forwarded root attributes | Implement `CmIconButton` in `CMUI-186`. Do not add an icon-name prop, own an icon catalog, infer a tooltip, or preserve unsupported VueForge feedback variants; retained icon products or authored Razor markup supply the icon. |
| `VfProgressBar` | Approve with presentation split | A labelled native progressbar with clamped determinate `value`/`max`, an explicit indeterminate mode that omits value ARIA, approved feedback tones, logical sizing, and reduced-motion behavior | Implement `CmProgressBar` in `CMUI-186`. Arbitrary heights, independently combinable stripes/animation, and application progress orchestration stay outside the stable contract. |
| `VfProgressSpinner` | Approve with presentation split | A compact labelled indeterminate progress indicator with finite shared sizes, approved feedback tones, hidden SVG decoration, and a non-animated reduced-motion presentation | Implement `CmProgressSpinner` in `CMUI-186`. Keep it distinct from ProgressBar so compact loading indicators do not create invalid Bar variant combinations; arbitrary CSS sizes and public SVG stroke geometry are not portable API. |
| `VfTag` | Supersede with Badge | Non-interactive status and category content already has the required native inline semantics, trusted content boundary, and complete feedback-tone vocabulary in `CmBadge` | Migrate to `CmBadge`; an outlined appearance alone does not justify another component contract. Close the `CMUI-184` Tag gap without adding a `CmTag` target. |

The approved components are supported by repeated Vue compositions, including Annabel grouped-form,
icon-action, and setup-progress patterns, plus framework-independent native semantics. No external
Annabel Razor page currently consumes these patterns. That Vue-led demand is a delivery risk, not
permission to weaken the two-adapter gate: `CMUI-186` must provide canonical significant DOM,
Vue SSR and interaction tests, Razor rendering parity, accessibility cases, shared CSS and visual
fixtures before any migration mapping changes from `compose` or `manual` to `replace`. Progress
animation must additionally prove `prefers-reduced-motion` behavior.

## CMUI-185 follow-up decision

Date: 2026-08-15

Status: Complete

`CMUI-185` re-evaluated the five behavior-rich candidates from the original `CMUI-173` audit.
The table below is an append-only follow-up and does not rewrite the historical candidate
classifications above. None of these candidates demonstrates current shared Vue and Annabel Razor
demand, so none advances to portable component delivery in `CMUI-186`.

| VueForge API | Final decision | Stable migration boundary | Destination and exclusions |
| --- | --- | --- | --- |
| `VfDataTableColumnChooser` | Application-owned composition | `CmDataTable` owns validated and ordered `visibleColumnKeys`; `CmCheckbox` and `CmPopover` can compose the application control that edits that state | Keep required-column policy, aggregate selection, persistence, and chooser presentation with the application. The real Annabel implementation establishes Vue composition demand but no matching Razor component demand. Do not add `CmDataTableColumnChooser`. |
| `VfMenuBar` | Application-owned native site navigation | The repository playground needs a flat URL-backed site-navigation row, expressible with native `nav`, `CmInline`, and `CmLink` plus application-owned history state | Do not translate that consumer into ARIA menubar semantics or treat `CmMenu`, which owns application actions rather than site navigation, as a direct replacement. Nested popup ownership, two-axis keyboard behavior, hover switching, floating placement, and focus restoration have no current two-platform demand. Do not add `CmMenuBar`. |
| `VfNavMenu` | Application-owned navigation tree | Native `nav` and list landmarks plus `CmLink` cover portable leaf semantics; the application owns recursive nodes and expanded state | Annabel's admin sidebar and setup flow mix tree rendering with routing, active ancestry, workflow selection, authorization, icon, compact-sidebar, and shell policy. There is no matching Razor navigation-tree demand, and `CmMenu` is not site navigation. Keep `AppNavMenu` application-owned and do not add `CmNavMenu`. |
| `VfStepper` | Supersede static presentation; keep workflow application-owned | An ordered list, native current-step text, and existing layout primitives cover a non-interactive progress summary | Step availability, validation gates, navigation commands, current-state mutation, and focus policy belong to the owning workflow. The real setup flow is Vue-owned and the Razor surface establishes no Stepper demand. Do not add `CmStepper`. |
| `VfTableOfContents` | Supersede static presentation; keep enhancement application-owned | Native `nav`, a list, heading anchors, `CmLink`, and layout primitives cover a static table of contents | Heading discovery, active-section observation, scroll containers, sticky offsets, smooth scrolling, URL mutation, and focus behavior depend on the document application. No current Razor consumer requires a shared enhanced contract. Do not add `CmTableOfContents`. |

These decisions apply the Phase 18 two-platform demand gate to behavior-rich APIs, whose shared
runtime, state, and accessibility obligations are materially larger than their static markup. A
future Vue and Razor consumer pair may reopen a narrowly specified contract, but frozen VueForge
behavior or one Vue application composition alone is not approval evidence. The migration remains
manual where application state is involved and uses semantic HTML plus existing CodeMonster UI
components where the static portion is already covered.

## Outcome

The original broad `compose` and `manual` buckets are now actionable:

- six components remain maintained compositions;
- eight are portable candidates for Phase 18;
- five require a split outcome;
- six remain application-owned;
- five shell-area wrappers need no standalone replacement;

The category totals describe primary outcomes; dependencies and secondary outcomes are recorded in
the tables and the machine-readable coverage inventory. No candidate is considered approved merely
because this audit found a plausible portable contract.
