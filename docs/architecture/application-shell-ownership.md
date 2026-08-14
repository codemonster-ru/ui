# Application shell ownership

Status: Accepted  
Date: 2026-08-13  
Roadmap item: `CMUI-146`

## Decision

CodeMonster UI does not promote the existing VueForge application shells to stable cross-platform
components. The portable layout vocabulary is Container, Stack, Inline, Section, and Grid. Page
shells are compositions of those primitives, semantic HTML, application navigation, and approved
components; their structure and state remain owned by each application until two concrete platform
consumers demonstrate the same contract.

The `ui-vue` and Annabel Razor adapters therefore do not expose `CmAppShell`, `CmAdminLayout`,
`CmAdminShell`, `CmDocumentLayout`, `CmAuthLayout`, `CmErrorLayout`, `CmSetupLayout`, or standalone
shell-area components. VueForge keeps its existing APIs during the migration and maintenance
period; this decision does not remove or deprecate them.

## Reviewed inventory

| VueForge API                                                                    | Current responsibility                                                                                      | CodeMonster UI outcome                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `VfAppShell`                                                                    | Responsive columns, sticky measured offsets, optional regions, and controlled sidebar state                 | Application-owned composition                     |
| `VfAdminLayout`                                                                 | Collapsible desktop navigation, hover preview, mobile drawer state, keyboard dismissal, and scoped commands | Application-owned behavior and composition        |
| `VfAdminShell`                                                                  | Fixed admin topbar, brand, sidebar, workspace, and footer structure                                         | Application-owned composition                     |
| `VfDocumentLayout`                                                              | Documentation-specific columns, edge treatment, measured sticky offsets, and optional regions               | Documentation-site composition                    |
| `VfAuthLayout`                                                                  | Product branding, page heading, form panel, and account-flow footer                                         | Recipe composed from primitives and semantic HTML |
| `VfErrorLayout`                                                                 | Product error copy, actions, centering, and surface treatment                                               | Recipe composed from primitives and semantic HTML |
| `VfSetupLayout`                                                                 | Setup workflow regions plus application-specific Enter/Escape actions                                       | Application-owned workflow                        |
| `VfHeaderArea`, `VfSidebarArea`, `VfContentArea`, `VfAsideArea`, `VfFooterArea` | Shell-internal region geometry and appearance                                                               | No standalone cross-platform component            |

## Why shells are not component contracts

- Landmark counts and placement depend on the surrounding application. A reusable shell cannot
  decide whether a region is the page's `main`, `header`, `aside`, or `footer` in isolation.
- Admin navigation state is coupled to routing, authorization, responsive drawer policy, focus
  restoration, and product-specific collapse behavior.
- Sticky offsets in `VfAppShell` and `VfDocumentLayout` depend on Vue DOM observation and Vue scoped
  slots rather than a framework-independent render contract.
- `VfSetupLayout` turns generic Enter and Escape keys into workflow events. That policy belongs to
  the form or wizard that understands validation and navigation.
- Auth and error pages have reusable visual patterns but insufficient behavior to justify permanent
  adapter APIs. Short recipes preserve semantic flexibility with less public surface.
- The shell-area wrappers are meaningful only as implementation regions of the legacy shells. The
  migrated primitives already cover their portable spacing and flow responsibilities.

## Composition guidance

Applications should build shells from native landmarks and CodeMonster UI primitives. Interactive
navigation may compose Button, Menu, Drawer, and the platform router while the application remains
the source of truth for open, collapsed, selected, and authorized state. Auth and error pages should
use Container, Stack, Inline, Section, and headings directly instead of adding package-owned wrapper
components.

Razor applications may progressively enhance navigation with `ui-runtime` controllers only when a
matching component behavior contract exists. They must not initialize shared runtime over
Vue-owned markup or reproduce Vue scoped-slot command APIs in PHP.

## Reconsideration criteria

A shell may return to the component roadmap only when all of the following evidence exists:

1. a real Vue application and a real Razor application require materially the same shell;
2. landmark ownership, responsive regions, navigation state, focus behavior, and fallback behavior
   can be specified without either platform's lifecycle;
3. the proposed API is smaller than composing the existing primitives and components;
4. canonical DOM, accessibility scenarios, visual fixtures, and migration impact are approved.

Meeting these criteria starts a new contract item; it does not retroactively make a VueForge shell
canonical.

## CMUI-188 verification

The boundary was re-verified on 2026-08-15 against the
[representative consumer inventory](../verification/consumer-usage-inventory.md) after the portable
components and maintained recipes were delivered.

| Reconsideration criterion                | Consumer evidence                                                                                                                                                                                                                                                                                       | Result  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Matching real Vue and Razor shell demand | The Vue playground owns a header, pathname/history state, dynamic sections, responsive navigation CSS, and theme state. Annabel Vue owns materially different admin/auth/setup shells. The real Annabel Razor page renders only Container, Stack, and Card, with no shell navigation or theme behavior. | Not met |
| Platform-neutral landmarks and behavior  | Responsive drawers, authorization, active navigation, focus restoration, measured sticky offsets, and setup workflow keys remain tied to each application and lifecycle.                                                                                                                                | Not met |
| An API smaller than composition          | Native `header`, `nav`, `main`, `aside`, and `footer` landmarks plus Container, Stack, Inline, Section, Grid, and the maintained recipes already form the smaller boundary.                                                                                                                             | Not met |
| Approved contract evidence               | No proposed shared shell has cleared the first three criteria, so no canonical DOM, accessibility scenarios, visual fixtures, or migration surface has been approved.                                                                                                                                   | Not met |

The criteria are conjunctive. Documentation recipes are migration guidance rather than evidence of
a real Razor shell consumer, so they do not reopen the component decision. A future materially
matching Vue and Razor demand starts a new contract review.

## Consequences

- The stable cohort stays portable and avoids speculative Razor shell abstractions.
- Applications retain control of routing, authorization, landmarks, workflow, and responsive
  navigation state.
- Existing VueForge consumers continue to receive the documented maintenance policy.
- Migration tooling reports shell imports for manual composition instead of renaming them.
