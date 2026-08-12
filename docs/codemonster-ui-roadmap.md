# CodeMonster UI roadmap

This document is the canonical implementation tracker for evolving VueForge into a cross-platform
CodeMonster UI design system. The current delivery scope covers the shared design foundation and
the Vue and Annabel Razor adapters. React and Angular adapters are unscheduled future considerations
and do not block the current roadmap or any release. They may enter the active scope only when a
concrete product need is identified.

The product identity and technical names are approved in
[CodeMonster UI product identity](./architecture/product-identity.md) and
[CodeMonster UI naming and prefixes](./architecture/naming-and-prefixes.md). Supported platform
floors are defined in [CodeMonster UI platform support](./architecture/platform-support.md), and
ownership is defined in [CodeMonster UI package boundaries](./architecture/package-boundaries.md).
Component specifications follow
[CodeMonster UI component contract format](./architecture/component-contract-format.md), and their
rendering follows [CodeMonster UI canonical HTML](./architecture/canonical-html.md).
Public APIs follow
[CodeMonster UI component API conventions](./architecture/component-api-conventions.md).
State representation follows [CodeMonster UI component states](./architecture/component-states.md).
Accessibility follows
[CodeMonster UI accessibility requirements](./architecture/accessibility-requirements.md).
Rendering modes follow [CodeMonster UI rendering strategy](./architecture/rendering-strategy.md).
Escaping and trusted markup follow [CodeMonster UI HTML security](./architecture/html-security.md).
Browser and CSS support follows
[CodeMonster UI browser and CSS support](./architecture/browser-and-css-support.md).
Distribution follows
[CodeMonster UI package topology and releases](./architecture/package-topology-and-releases.md).
Migration follows [VueForge migration policy](./architecture/vueforge-migration-policy.md).
Initial scope follows [CodeMonster UI pilot components](./architecture/pilot-components.md).
Repository layout follows
[CodeMonster UI workspace conventions](./architecture/workspace-conventions.md).

## How to use this roadmap

- Complete phases in order unless a documented dependency permits parallel work.
- Skip the unscheduled React and Angular adapter phases; after Phase 9, continue with Phase 12.
- Keep every implementation commit buildable and include its tests in the same commit.
- Mark a checklist item complete in the commit that completes the work.
- Write commit subjects in the repository style: concise, imperative, sentence case, and without a
  Conventional Commits prefix.
- Reference the stable item identifier in the commit body, for example `Roadmap: CMUI-021`.
- Do not mark an item complete for partial implementation.
- Record material scope or architecture changes in the decision log before changing this plan.
- Record Annabel work with its repository commit SHA in the cross-repository log.
- Do not squash completed roadmap commits when merging the integration branch.

## Branches

| Repository                | Integration branch      | Responsibility                          |
| ------------------------- | ----------------------- | --------------------------------------- |
| `codemonster-ru/vueforge` | `feat/codemonster-ui`   | Shared foundation and platform adapters |
| `codemonster-ru/annabel`  | `feat/razor-components` | Generic Razor component model           |

Short-lived branches may be created from the relevant integration branch. Merge or rebase them
without squashing so each completed roadmap item remains visible.

## Definition of done

An item is complete only when all applicable conditions are satisfied:

- public behavior and ownership are documented;
- implementation follows the approved component contract;
- unit, contract, SSR, accessibility, and visual tests relevant to the change pass;
- package exports and packed-consumer behavior are verified when distribution changes;
- no unrelated compatibility layer or platform dependency is introduced;
- this roadmap is updated in the same commit.

## Progress

- Current phase: Phase 13 — Component expansion
- Current milestone: M6 — utilities and stable component cohort
- Completed milestones: M0 — approved architecture; M1 — framework-independent tokens and CSS; M2 — Button and Card parity; M3 — Input form parity; M4 — Accordion interaction parity
- Next item: `CMUI-143d`

## Milestones

| Milestone | Outcome                                                                   | Status               |
| --------- | ------------------------------------------------------------------------- | -------------------- |
| M0        | Product name, boundaries, contracts, and migration policy approved        | Completed            |
| M1        | Framework-independent tokens and CSS packages build and publish correctly | Completed            |
| M2        | Button and Card render with parity in Vue and Annabel Razor               | Completed            |
| M3        | Input supports Vue binding and native Razor form submission               | Completed            |
| M4        | Accordion proves accessible cross-platform interaction                    | Completed            |
| M5        | React and Angular implement the four pilot contracts                      | Future consideration |
| M6        | Utility CSS and the first stable component cohort are available           | Not started          |
| M7        | VueForge migration and CodeMonster UI 1.0 are complete                    | Not started          |

## Phase 0 — Product and architecture decisions

- [x] `CMUI-001` Approve the product name and repository name.
- [x] `CMUI-002` Approve npm, Composer, CSS, custom-property, and component prefixes.
- [x] `CMUI-003` Define supported platforms and their version floors.
- [x] `CMUI-004` Define shared-kernel and adapter ownership boundaries.
- [x] `CMUI-005` Define the canonical component contract format.
- [x] `CMUI-006` Define canonical HTML and significant DOM parity rules.
- [x] `CMUI-007` Define props, attributes, events, and slots conventions.
- [x] `CMUI-008` Define component states through classes, native attributes, ARIA, and `data-*`.
- [x] `CMUI-009` Define accessibility and keyboard-interaction requirements.
- [x] `CMUI-010` Define SSR, progressive-enhancement, and hydration boundaries.
- [x] `CMUI-011` Define escaping, trusted HTML, and slot security rules.
- [x] `CMUI-012` Define browser support and CSS feature policy.
- [x] `CMUI-013` Define package topology and release ownership.
- [x] `CMUI-014` Decide the VueForge maintenance and migration policy.
- [x] `CMUI-015` Approve the four pilot components: Button, Card, Input, and Accordion.

### M0 exit gate

- [x] `CMUI-G000` All phase 0 decisions are approved and recorded as architecture documents.

## Phase 1 — Repository and contract infrastructure

- [x] `CMUI-016` Add CodeMonster UI workspace conventions.
- [x] `CMUI-017` Add shared package metadata helpers or validation.
- [x] `CMUI-018` Add the component contract directory structure.
- [x] `CMUI-019` Add canonical HTML fixture infrastructure.
- [x] `CMUI-020` Add normalized DOM comparison utilities.
- [x] `CMUI-021` Add a root contract-test command.
- [x] `CMUI-022` Add cross-platform accessibility test infrastructure.
- [x] `CMUI-023` Add visual parity fixture infrastructure.
- [x] `CMUI-024` Add new packages to root lint, typecheck, test, and build orchestration.
- [x] `CMUI-025` Extend package-contract checks for CodeMonster UI packages.
- [x] `CMUI-026` Add packed-consumer checks for CSS-only consumers.
- [x] `CMUI-027` Add bundle and CSS size budgets for new packages.

## Phase 2 — Framework-independent tokens

- [x] `CMUI-028` Scaffold `@codemonster-ru/ui-tokens`.
- [x] `CMUI-029` Move primitive color token ownership into the tokens package.
- [x] `CMUI-030` Move semantic color token ownership into the tokens package.
- [x] `CMUI-031` Move spacing and sizing token ownership into the tokens package.
- [x] `CMUI-032` Move typography token ownership into the tokens package.
- [x] `CMUI-033` Move radius, border, and shadow token ownership into the tokens package.
- [x] `CMUI-034` Move motion token ownership into the tokens package.
- [x] `CMUI-035` Move breakpoint token ownership into the tokens package.
- [x] `CMUI-036` Add the light theme preset.
- [x] `CMUI-037` Add the dark theme preset.
- [x] `CMUI-038` Generate `--cm-*` custom properties.
- [x] `CMUI-039` Generate portable breakpoint CSS.
- [x] `CMUI-040` Expose the framework-independent theme serialization API.
- [x] `CMUI-041` Add token schema and generated CSS contract tests.
- [x] `CMUI-042` Document token and theme consumption.

## Phase 3 — Framework-independent CSS

- [x] `CMUI-043` Scaffold `@codemonster-ru/ui-css`.
- [x] `CMUI-044` Add reset and document foundation styles.
- [x] `CMUI-045` Add focus-visible and focus-ring foundations.
- [x] `CMUI-046` Add reduced-motion and forced-colors foundations.
- [x] `CMUI-047` Add shared control primitives.
- [x] `CMUI-048` Add shared surface primitives.
- [x] `CMUI-049` Expose complete and foundation-only stylesheets.
- [x] `CMUI-050` Add CSS subpath export checks.
- [x] `CMUI-051` Add CSS-only packed-consumer smoke tests.
- [x] `CMUI-052` Prevent Vue imports and `vf` selectors in the new CSS package.
- [x] `CMUI-053` Document CSS-only usage.

### M1 exit gate

- [x] `CMUI-G001` Tokens and CSS build without Vue and pass packed-consumer verification.

## Phase 4 — Button vertical slice

- [x] `CMUI-054` Define the Button component contract.
- [x] `CMUI-055` Add Button canonical fixtures for variants and sizes.
- [x] `CMUI-056` Add Button canonical fixtures for disabled and loading states.
- [x] `CMUI-057` Add Button canonical fixtures for link rendering and icon slots.
- [x] `CMUI-058` Move Button styles into the shared CSS package.
- [x] `CMUI-059` Add Button selector and accessibility contracts.
- [x] `CMUI-060` Scaffold `@codemonster-ru/ui-vue`.
- [x] `CMUI-061` Add Vue attribute forwarding and class utilities.
- [x] `CMUI-062` Add Vue `CmButton`.
- [x] `CMUI-063` Add Vue Button loading and icon-slot rendering.
- [x] `CMUI-064` Add Vue Button link rendering.
- [x] `CMUI-065` Verify Vue Button DOM, events, and SSR output.

## Phase 5 — Generic Annabel Razor component model

These items are implemented in `codemonster-ru/annabel`. Each completed item must include its tests
and be recorded in the cross-repository log below.

- [x] `ARAZOR-001` Approve Razor component syntax and compilation semantics.
- [x] `ARAZOR-002` Add a trusted rendered-HTML value object.
- [x] `ARAZOR-003` Add component, render-context, and resolver contracts.
- [x] `ARAZOR-004` Add the component registry and prefix registration.
- [x] `ARAZOR-005` Parse self-closing component tags.
- [x] `ARAZOR-006` Parse paired component tags.
- [x] `ARAZOR-007` Compile static, expression, and boolean props.
- [x] `ARAZOR-008` Compile default slots.
- [x] `ARAZOR-009` Compile named slots.
- [x] `ARAZOR-010` Support nested components.
- [x] `ARAZOR-011` Render registered components through the resolver.
- [x] `ARAZOR-012` Preserve trusted component output while escaping user values.
- [x] `ARAZOR-013` Add diagnostics for unknown and malformed components.
- [x] `ARAZOR-014` Verify component cache invalidation.
- [x] `ARAZOR-015` Document custom component registration and security.
- [x] `ARAZOR-016` Prepare the Annabel Razor component API release.

## Phase 6 — CodeMonster UI Annabel Razor adapter

- [x] `CMUI-066` Scaffold the `codemonster-ru/ui` Composer package.
- [x] `CMUI-067` Add the Annabel UI component provider and `cm` prefix registration.
- [x] `CMUI-068` Add shared prop validation, attribute bags, and class building.
- [x] `CMUI-069` Add the shared asset manifest and publishing API.
- [x] `CMUI-070` Package the exact shared CSS artifacts for PHP consumers.
- [x] `CMUI-071` Add the PHP `CmButton` component.
- [x] `CMUI-072` Add the Button Razor template.
- [x] `CMUI-073` Add Razor Button loading and link rendering.
- [x] `CMUI-074` Verify Razor Button escaping and accessibility.
- [x] `CMUI-075` Compare significant Vue and Razor Button DOM.
- [x] `CMUI-076` Document Button usage in Vue and Razor.

## Phase 7 — Card and composition

- [x] `CMUI-077` Define the Card component contract and fixtures.
- [x] `CMUI-078` Move Card styles into the shared CSS package.
- [x] `CMUI-079` Add Vue `CmCard` with header, default, and footer slots.
- [x] `CMUI-080` Verify Vue Card DOM and SSR output.
- [x] `CMUI-081` Add PHP Card and Card section components.
- [x] `CMUI-082` Add Card Razor templates.
- [x] `CMUI-083` Verify nested Razor Card rendering and escaping.
- [x] `CMUI-084` Compare significant Vue and Razor Card DOM.
- [x] `CMUI-085` Document Card composition in Vue and Razor.

### M2 exit gate

- [x] `CMUI-G002` Button and Card pass Vue/Razor DOM, SSR, accessibility, and visual parity checks.

## Phase 8 — Input and native forms

- [x] `CMUI-086` Define Field and Input contracts and fixtures.
- [x] `CMUI-087` Define native submission and validation behavior.
- [x] `CMUI-088` Move Field and Input styles into the shared CSS package.
- [x] `CMUI-089` Add Vue `CmField`.
- [x] `CMUI-090` Add Vue `CmInput` and model binding.
- [x] `CMUI-091` Verify Vue Field/Input DOM, events, and SSR output.
- [x] `CMUI-092` Add PHP Field and Input components.
- [x] `CMUI-093` Add Field and Input Razor templates.
- [x] `CMUI-094` Preserve submitted values and render validation errors.
- [x] `CMUI-095` Verify native Razor form submission and escaping.
- [x] `CMUI-096` Compare Vue and Razor Field/Input accessibility.
- [x] `CMUI-097` Document Vue and Razor form integration.

### M3 exit gate

- [x] `CMUI-G003` Input supports Vue binding and native Razor form submission with parity.

## Phase 9 — Shared runtime and Accordion

- [x] `CMUI-098` Scaffold `@codemonster-ru/ui-runtime`.
- [x] `CMUI-099` Add controller lifecycle and component discovery.
- [x] `CMUI-100` Add safe repeated initialization and disposal.
- [x] `CMUI-101` Add optional mutation-observer initialization.
- [x] `CMUI-102` Add shared custom-event helpers.
- [x] `CMUI-103` Define the Accordion rendering and behavior contract.
- [x] `CMUI-104` Move Accordion styles into the shared CSS package.
- [x] `CMUI-105` Add the framework-independent Accordion controller.
- [x] `CMUI-106` Add Accordion ARIA synchronization and keyboard behavior.
- [x] `CMUI-107` Add Vue `CmAccordion`.
- [x] `CMUI-108` Verify Vue Accordion behavior and SSR output.
- [x] `CMUI-109` Add PHP/Razor Accordion rendering.
- [x] `CMUI-110` Verify progressively enhanced Razor Accordion behavior.
- [x] `CMUI-111` Compare cross-platform Accordion state transitions.
- [x] `CMUI-112` Document runtime installation and progressive enhancement.

### M4 exit gate

- [x] `CMUI-G004` Accordion proves accessible shared behavior in Vue and Razor consumers.

## Phase 10 — React adapter (not scheduled)

This phase is a future consideration outside the active roadmap. It has no target release or start
date and should enter the delivery scope only in response to a concrete product need.

- [ ] `CMUI-113` Scaffold `@codemonster-ru/ui-react`.
- [ ] `CMUI-114` Add React shared prop and attribute utilities.
- [ ] `CMUI-115` Add and verify React `CmButton`.
- [ ] `CMUI-116` Add and verify React `CmCard`.
- [ ] `CMUI-117` Add and verify React `CmField` and `CmInput`.
- [ ] `CMUI-118` Add and verify React `CmAccordion`.
- [ ] `CMUI-119` Include React in parity and packed-consumer checks.
- [ ] `CMUI-120` Document React installation and pilot components.

## Phase 11 — Angular adapter (not scheduled)

This phase is a future consideration outside the active roadmap. It has no target release or start
date and should enter the delivery scope only in response to a concrete product need.

- [ ] `CMUI-121` Scaffold `@codemonster-ru/ui-angular`.
- [ ] `CMUI-122` Add Angular shared input and attribute utilities.
- [ ] `CMUI-123` Add and verify Angular `CmButton`.
- [ ] `CMUI-124` Add and verify Angular `CmCard`.
- [ ] `CMUI-125` Add and verify Angular `CmField` and `CmInput`.
- [ ] `CMUI-126` Add and verify Angular `CmAccordion`.
- [ ] `CMUI-127` Include Angular in parity and packed-consumer checks.
- [ ] `CMUI-128` Document Angular installation and pilot components.

### M5 exit gate (not scheduled)

- [ ] `CMUI-G005` All four adapters implement and verify the pilot component contracts.

## Phase 12 — Utility CSS

- [x] `CMUI-129` Approve the initial utility scope and naming contract.
- [x] `CMUI-130` Scaffold `@codemonster-ru/ui-utilities`.
- [x] `CMUI-131` Generate display utilities from the approved contract.
- [x] `CMUI-132` Generate flex and grid utilities.
- [x] `CMUI-133` Generate spacing and sizing utilities from tokens.
- [x] `CMUI-134` Generate typography and color utilities from tokens.
- [x] `CMUI-135` Generate border and radius utilities from tokens.
- [x] `CMUI-136` Add approved responsive variants.
- [x] `CMUI-137` Add token-reference and CSS-size contract tests.
- [x] `CMUI-138` Document utility CSS usage and limitations.

## Phase 13 — Component expansion

Each component follows the same sequence: contract, shared CSS, Vue and Annabel Razor adapters,
applicable shared runtime, parity tests, and documentation. Add child checklist items before
starting a cohort. React and Angular implementations are not required unless they are explicitly
added to the active scope in the future.

- [x] `CMUI-139` Migrate the display cohort: Badge, Alert, Avatar, Divider, and Skeleton.
  - [x] `CMUI-139a` Define contracts and canonical fixtures for the display cohort.
  - [x] `CMUI-139b` Add shared CSS for the display cohort.
  - [x] `CMUI-139c` Add Vue adapters for the display cohort.
  - [x] `CMUI-139d` Add Annabel Razor adapters for the display cohort.
  - [x] `CMUI-139e` Verify display-cohort parity, accessibility, visual fixtures, and documentation.
- [x] `CMUI-140` Migrate the form cohort: Checkbox, Radio, Textarea, and Switch.
  - [x] `CMUI-140a` Define contracts, native form semantics, and fixtures for the form cohort.
  - [x] `CMUI-140b` Add shared CSS for Checkbox, Radio, Textarea, and Switch.
  - [x] `CMUI-140c` Add Vue form adapters and binding verification.
  - [x] `CMUI-140d` Add Annabel Razor form adapters and submission verification.
  - [x] `CMUI-140e` Verify form-cohort DOM, accessibility, interaction, and documentation parity.
- [x] `CMUI-141` Migrate the navigation cohort: Link, Breadcrumbs, Tabs, Dropdown, and Menu.
  - [x] `CMUI-141a` Define navigation contracts, canonical fixtures, and keyboard behavior.
  - [x] `CMUI-141b` Add shared CSS for Link, Breadcrumbs, Tabs, Dropdown, and Menu.
  - [x] `CMUI-141c` Add shared progressive-enhancement runtime for interactive navigation.
  - [x] `CMUI-141d` Add Vue navigation adapters and controlled-state verification.
  - [x] `CMUI-141e` Add Annabel Razor navigation adapters and runtime integration.
  - [x] `CMUI-141f` Verify navigation DOM, accessibility, interaction, visual, and documentation parity.
- [x] `CMUI-142` Migrate the overlay cohort: Dialog, Drawer, Popover, and Tooltip.
  - [x] `CMUI-142a` Define overlay contracts, canonical fixtures, focus management, and dismissal behavior.
  - [x] `CMUI-142b` Add shared CSS for Dialog, Drawer, Popover, and Tooltip.
  - [x] `CMUI-142c` Add shared progressive-enhancement runtime for overlay interaction.
  - [x] `CMUI-142d` Add Vue overlay adapters and controlled-state verification.
  - [x] `CMUI-142e` Add Annabel Razor overlay adapters and runtime integration.
  - [x] `CMUI-142f` Verify overlay DOM, accessibility, interaction, visual, and documentation parity.
- [ ] `CMUI-143` Migrate the advanced-input cohort: Select, DatePicker, and CommandPalette.
  - [x] `CMUI-143a` Define advanced-input contracts, canonical fixtures, and keyboard behavior.
  - [x] `CMUI-143b` Add shared CSS for Select, DatePicker, and CommandPalette.
  - [x] `CMUI-143c` Add shared progressive-enhancement runtime for interactive advanced inputs.
  - [ ] `CMUI-143d` Add Vue advanced-input adapters and binding verification.
  - [ ] `CMUI-143e` Add Annabel Razor advanced-input adapters and submission integration.
  - [ ] `CMUI-143f` Verify advanced-input DOM, accessibility, interaction, visual, and documentation parity.
- [ ] `CMUI-144` Migrate the data-display cohort: Table and DataTable.
- [ ] `CMUI-145` Migrate layout primitives.
- [ ] `CMUI-146` Review application shells for platform-independent ownership.
- [ ] `CMUI-147` Decide and implement CodeBlock ownership.
- [ ] `CMUI-148` Decide and implement Playground ownership.

### M6 exit gate

- [ ] `CMUI-G006` Utilities and the approved stable component cohort pass the Vue and Razor gates.

## Phase 14 — VueForge migration and release

- [ ] `CMUI-149` Freeze the final VueForge feature baseline.
- [ ] `CMUI-150` Publish the VueForge-to-CodeMonster UI package mapping.
- [ ] `CMUI-151` Add a read-only migration checker.
- [ ] `CMUI-152` Add deterministic codemods for approved renames.
- [ ] `CMUI-153` Migrate the repository examples to CodeMonster UI.
- [ ] `CMUI-154` Migrate the documentation site to CodeMonster UI.
- [ ] `CMUI-155` Run complete npm packed-consumer verification.
- [ ] `CMUI-156` Run complete Composer packed-consumer verification.
- [ ] `CMUI-157` Run Vue/Razor accessibility and visual verification.
- [ ] `CMUI-158` Publish CodeMonster UI prereleases.
- [ ] `CMUI-159` Validate real Vue admin and Razor CMS template consumers.
- [ ] `CMUI-160` Resolve prerelease contract feedback.
- [ ] `CMUI-161` Publish CodeMonster UI 1.0 migration notes.
- [ ] `CMUI-162` Publish CodeMonster UI 1.0.
- [ ] `CMUI-163` Move VueForge packages to the approved maintenance state.
- [ ] `CMUI-164` Rename the repository only after migration gates pass.

### M7 exit gate

- [ ] `CMUI-G007` CodeMonster UI 1.0 is published and validated by real consumers.

## Decision log

Add decisions chronologically. Do not rewrite old entries; supersede them with a new entry.

| Date       | Decision                                                                                                                       | Reason                                                                                                                              | Affected items                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 2026-08-11 | Track the migration in this repository with stable checklist identifiers.                                                      | Preserve context and make progress reviewable across sessions.                                                                      | All                                    |
| 2026-08-11 | Name the product CodeMonster UI and target repository `codemonster-ui`.                                                        | Establish a platform-neutral identity under the existing CodeMonster organization.                                                  | `CMUI-001`, `CMUI-164`                 |
| 2026-08-11 | Use `ui-*` distribution names and the `cm` technical prefix.                                                                   | Keep platform ownership explicit while unifying CSS, HTML, and component naming.                                                    | `CMUI-002`                             |
| 2026-08-11 | Start from Vue 3.5, React 19.2, Angular 22, Annabel Razor 2, and PHP 8.2.                                                      | Target maintained platform lines while retaining an adoption path for current Annabel applications.                                 | `CMUI-003`                             |
| 2026-08-11 | Separate focused shared packages from thin platform adapters without a generic core package.                                   | Preserve framework independence and keep public ownership explicit.                                                                 | `CMUI-004`                             |
| 2026-08-11 | Describe components with normative prose, JSON manifests, render cases, canonical HTML, and behavior scenarios.                | Provide enforceable parity without introducing a cross-platform source generator.                                                   | `CMUI-005`                             |
| 2026-08-11 | Compare significant semantic DOM instead of byte-identical framework output.                                                   | Enforce one HTML contract while ignoring serialization and compiler details.                                                        | `CMUI-006`                             |
| 2026-08-11 | Share semantic component APIs while mapping binding and events to native platform conventions.                                 | Preserve recognizable parity without fighting each framework's programming model.                                                   | `CMUI-007`                             |
| 2026-08-11 | Prefer native and ARIA state, reserve `data-cm-state` for shared non-native state, and use modifiers for visual configuration. | Avoid duplicate state hooks and keep browser semantics authoritative.                                                               | `CMUI-008`                             |
| 2026-08-11 | Target WCAG 2.2 AA with native HTML first and shared keyboard, focus, and accessibility scenarios.                             | Make accessibility part of every component contract and adapter parity gate.                                                        | `CMUI-009`                             |
| 2026-08-11 | Separate CSS-only, server-rendered, progressively enhanced, and framework-hydrated modes.                                      | Keep Razor framework-independent while preserving native framework hydration.                                                       | `CMUI-010`                             |
| 2026-08-11 | Escape ordinary values contextually and compose rendered components and slots only through a trusted-markup type.              | Preserve Razor composition without turning strings or raw interpolation into an XSS boundary.                                       | `CMUI-011`, `ARAZOR-002`, `ARAZOR-012` |
| 2026-08-11 | Target maintained evergreen browsers and ship standards-based CSS without a legacy build.                                      | Give CSS-only and framework consumers one modern, testable browser contract.                                                        | `CMUI-012`                             |
| 2026-08-11 | Keep shared packages and adapters in one monorepo with independent SemVer and topological releases.                            | Coordinate contracts across npm and Composer without publishing unchanged packages.                                                 | `CMUI-013`                             |
| 2026-08-11 | Launch a clean CodeMonster UI package line and retain VueForge through verified consumer migration.                            | Avoid misleading in-place renames and permanent compatibility layers.                                                               | `CMUI-014`, `CMUI-149`–`CMUI-164`      |
| 2026-08-11 | Prove the architecture with Button, Card, Input, and Accordion before expanding platforms or components.                       | Cover props, composition, forms, and interaction with the smallest representative set.                                              | `CMUI-015`, M2–M4                      |
| 2026-08-11 | Complete M0 and begin repository and contract infrastructure work.                                                             | All product and architecture decisions passed their documented phase gate.                                                          | `CMUI-G000`, M0                        |
| 2026-08-12 | Leave React and Angular adapters unscheduled until a concrete product need appears.                                            | Keep implementation focused on Vue and Annabel Razor without committing future releases to adapters that have no current consumers. | M5, `CMUI-113`–`CMUI-128`, `CMUI-G005` |

## Cross-repository log

Record Annabel work here when an `ARAZOR-*` item is completed.

| Item         | Annabel commit | CodeMonster UI tracking commit | Notes                               |
| ------------ | -------------- | ------------------------------ | ----------------------------------- |
| `ARAZOR-001` | `720f2b8`      | This row                       | Component syntax and semantics ADR. |
| `ARAZOR-002` | `ce6fe86`      | This row                       | Trusted rendered-HTML value object. |
| `ARAZOR-003` | `9eaa7e0`      | This row                       | Component and resolver contracts.   |
| `ARAZOR-004` | `7f63002`      | This row                       | Component registry and providers.   |
| `ARAZOR-005` | `68e2287`      | This row                       | Self-closing component parser.      |
| `ARAZOR-006` | `06d7459`      | This row                       | Paired and nested tag parsing.      |
| `ARAZOR-007` | `9c800a2`      | This row                       | Static, expression, boolean props.  |
| `ARAZOR-008` | `2b70ebe`      | This row                       | Lazy default-slot compilation.      |
| `ARAZOR-009` | `ce32bc8`      | This row                       | Direct named-slot compilation.      |
| `ARAZOR-010` | `cebf892`      | This row                       | Recursive nested compilation.       |
| `ARAZOR-011` | `1ec5b97`      | This row                       | Resolver-backed component runtime.  |
| `ARAZOR-012` | `ff7711e`      | This row                       | Trusted composition boundary.       |
| `ARAZOR-013` | `0bea332`      | This row                       | Component compiler diagnostics.     |
| `ARAZOR-014` | `d5cf5cf`      | This row                       | Registration cache invalidation.    |
| `ARAZOR-015` | `e617b7d`      | This row                       | Registration and security guide.    |
| `ARAZOR-016` | `e36724a`      | This row                       | Razor 2.1 component API release.    |

## Scope-change log

Record additions, removals, splits, and reordered dependencies before editing the numbered checklist.

| Date       | Change                                                                                                                                                 | Reason                                                                                                                     | Decision reference        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 2026-08-12 | Removed React and Angular from the active delivery sequence and all release gates; retained their existing items as unscheduled future considerations. | Focus implementation on Vue and Annabel Razor while preserving stable roadmap identifiers in case a concrete need appears. | 2026-08-12 scope decision |
