# CodeMonster UI direct replacement capability audit

Status: Complete
Date: 2026-08-14
Roadmap item: `CMUI-172`

## Purpose

This audit compares the 33 direct replacements in the frozen VueForge migration map with the
current CodeMonster UI contracts and Vue and Annabel Razor adapters. It distinguishes a working
cross-platform baseline from the complete VueForge feature surface.

`supported` means the current contract and both active adapters cover the stated use case.
`superseded` means CodeMonster UI intentionally uses a different portable API or native platform
primitive. `application-owned` means the behavior depends on a Vue-only integration such as a
router. `missing` means a material portable VueForge use case has no current equivalent and must be
considered by the maturity backlog.

## Evidence and method

The audit reviewed:

- the public props, events, slots, and related types in `docs/core/components` and
  `docs/layouts/components`;
- the frozen VueForge components and their focused tests in `packages/core` and `packages/layouts`;
- the canonical contracts and behavior scenarios in `contracts`;
- public Vue types, implementations, SSR/parity tests, and interaction tests in `packages/vue`;
- Annabel Razor implementations and parity tests in `packages/razor`;
- shared progressive-enhancement behavior in `packages/runtime`.

Exact framework API spelling is not required to match. A capability is considered preserved only
when the underlying stable use case is available. Merely having matching `Vf*` and `Cm*` names is
not evidence of parity.

## Findings

### Foundation components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfButton` → `CmButton` | Native actions, submit/reset behavior, loading/disabled state, sizes, primary/secondary/danger/ghost variants, and icon regions | `block` moves to layout/width utilities; feedback-only success/info/warn/help/contrast action colors are not Button variants; link mode is now explicit through `href` | None identified |
| `VfCard` → `CmCard` | Title, header/body/footer composition, compact density, forwarded attributes, and semantic root selection | `element` replaces an unrestricted wrapper assumption with an approved semantic set | None identified |
| `VfField` → `CmField` | Label, description, error, invalid/required state, named content, and accessible control linkage | Floating/side label presentation is replaced by the single stable label structure | None identified |
| `VfInput` → `CmInput` | Native text-like input types, Vue binding, server form values, sizes, disabled/readonly/required/invalid state | Native attributes are forwarded instead of duplicating their complete surface as props | Leading/trailing adornments, built-in clear action, and password reveal |
| `VfAccordion` → `CmAccordion` | Disclosure semantics, disabled items, controlled/uncontrolled open state, single/multiple mode, keyboard navigation, Vue interaction, and Razor enhancement | A collection contract replaces nested one-section component instances | Trusted rich trigger and panel content; current items accept text only |

### Display components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfAlert` → `CmAlert` | Tones, title/body content, custom title and icon slots, semantic status content | The `icon` name and `hideIcon` props are replaced by explicit optional icon composition; `warn` is named `warning` | None identified |
| `VfAvatar` → `CmAvatar` | Image/alt, label fallback, custom fallback content, sizes, and shapes | The VueForge icon-name prop is replaced by the default composition boundary because icons remain a side-by-side product | None identified |
| `VfBadge` → `CmBadge` | Text content and all approved semantic tones | `warn` is named `warning` | None identified |
| `VfDivider` → `CmDivider` | Horizontal and vertical semantic separators | None | None identified |
| `VfSkeleton` → `CmSkeleton` | Minimum height, animation, reduced-motion behavior, and radius variants | Arbitrary radius strings are replaced by shared radius tokens | None identified |

### Native form components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfCheckbox` → `CmCheckbox` | Boolean binding, value submission, label slot, size, invalid, disabled, required, indeterminate, and change behavior | Native form submission is authoritative | None identified |
| `VfRadio` → `CmRadio` | Group value binding/submission, label slot, size, invalid, disabled, required, and change behavior | Native radio grouping is authoritative | None identified |
| `VfTextarea` → `CmTextarea` | String binding/submission, size, invalid, disabled, readonly, required, and forwarded native attributes | Native textarea attributes are authoritative | None identified |
| `VfSwitch` → `CmSwitch` | Boolean binding/submission, label slot, size, invalid, disabled, required, and switch semantics | Reduced-motion CSS replaces `static`; shared tokens replace `thumbContrast` | Custom thumb content |

### Navigation components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfLink` → `CmLink` | Native `href`, target/rel forwarding, safe `_blank` relationship, underline modes, tones, and content | Router `to` and custom router component selection are application-owned; applications can apply `cm-link` styling to their router link | None identified |
| `VfBreadcrumbs` → `CmBreadcrumbs` | Native links, current/disabled items, accessible navigation label, and custom separator content | Router destinations and router component resolution are application-owned | None identified |
| `VfMenu` → `CmMenu` | Action/link items, disabled/active/danger states, selection events, roving focus, Home/End/arrows, and Escape requests | Vue component instances are replaced by a portable data collection; icons remain application-owned with the retained icon product | Rich item content and per-link `target`/`rel` metadata |
| `VfDropdown` → `CmDropdown` | Controlled open state, disabled state, two placements, menu selection, outside dismissal, keyboard opening, and focus restoration | In-place portable rendering replaces teleport configuration; explicit application state replaces `defaultOpen` | Arbitrary trigger and menu-body slots, plus the pills presentation variant |
| `VfPopover` → `CmPopover` | Controlled open state, disabled state, placement, outside/Escape dismissal, focus restoration, and rich panel body | In-place portable rendering and fixed dismissal behavior replace teleport and policy toggles | Arbitrary trigger content and trigger semantics |
| `VfTabs` → `CmTabs` | Tab semantics, controlled selection, disabled items, panels, roving keyboard selection, and Razor enhancement | Stable component/item IDs replace caller-provided `tabId` and `panelId` | Rich tab labels and panel content, externally owned panels, and explicit uncontrolled default selection |

### Overlay components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfDialog` → `CmDialog` | Native modal semantics, title/description, controlled state, body/footer content, focus trap/restoration, Escape, and optional dismissal lock | Native `<dialog>` and in-place rendering replace teleport/scroll-lock targets; `dismissible` replaces several close flags | Custom header, title/description markup, header actions, sizes, and divided presentation |
| `VfDrawer` → `CmDrawer` | Modal drawer semantics, start/end side, title/description, controlled state, body/footer content, focus handling, and dismissal | `side` replaces physical placement; native `<dialog>` and in-place rendering replace teleport/scroll-lock targets | Custom header/actions, size, offsets, padding/divider/rounded variants, and configurable dismissal policy |
| `VfTooltip` → `CmTooltip` | Labelled trigger, tooltip semantics, focus/hover lifecycle, Escape dismissal, logical placements, and tokenized delays | Token delays replace arbitrary milliseconds; in-place rendering replaces teleport configuration | Arbitrary trigger elements and rich tooltip content |

### Advanced input and data components

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfSelect` → `CmSelect` | Native options, disabled options, placeholder, binding/submission, size, invalid, disabled, and required state | Native `<select>` replaces the custom teleported listbox, its placement API, and custom leading/trailing icons | Built-in clear action |
| `VfDatePicker` → `CmDatePicker` | Native single-date value, min/max, binding/submission, size, invalid, disabled, readonly, and required state | Native `input[type=date]` replaces locale-specific popup positioning and teleport behavior for the baseline | Multiple and range selection, month/year picker modes, time selection and minute steps, locale/display formatting, first-day configuration, clear action, and custom labels |
| `VfCommandPalette` → `CmCommandPalette` | Controlled open/query state, filtering, disabled commands, keyboard navigation, selection, modal focus, and Razor enhancement | A typed command collection and fixed safe renderer replace arbitrary item values; native `<dialog>` replaces teleport configuration | Loading/idle states, match highlighting, custom actions/results/items/empty/footer content, submit-without-selection, close policy controls, default state, maximum height, and footer hints |
| `VfTable` → `CmTable` | Caption/header/body/footer composition, density, stripes, dividers, sticky header, semantic table structure, and responsive wrapper | `density="compact"` replaces `compact` | None identified |
| `VfDataTable` → `CmDataTable` | Portable text cells, caption, density/presentation, loading/error/empty states, controlled sorting, row selection, page requests, Vue behavior, and Razor enhancement | Application-owned data operations replace built-in client sorting/pagination; string row IDs replace callback row keys | Page-size controls and pagination summaries; row-select constraints and row expansion; custom header/cell/state/footer rendering; column visibility/order/reordering/resizing/pinning; multi-sort; skeleton loading modes; complete localization labels |

### Layout primitives

| Replacement | Supported | Superseded or application-owned | Missing portable capability |
| --- | --- | --- | --- |
| `VfContainer` → `CmContainer` | Default/fluid widths, md/lg/xl/2xl sizes, semantic content, and forwarded attributes | `element` restricts the old arbitrary `as` value to the approved cross-platform semantic set | None identified |
| `VfStack` → `CmStack` | Vertical flow, semantic content, and forwarded attributes | `element` restricts arbitrary `as` to the approved semantic set | None identified |
| `VfInline` → `CmInline` | Inline flow, optional wrapping, semantic content, and forwarded attributes | `element` restricts arbitrary `as` to the approved semantic set | None identified |
| `VfSection` → `CmSection` | Section flow, optional surface, semantic content, and forwarded attributes | `element` restricts arbitrary `as` to the approved semantic set | None identified |
| `VfGrid` → `CmGrid` | Responsive grid flow, semantic content, and forwarded attributes | `element` restricts arbitrary `as` to the approved semantic set | None identified |

## Outcome

All 33 direct replacements have a verified cross-platform baseline. Sixteen replacements also have
either a missing portable capability or an application-owned integration that must remain visible
during migration. The highest-risk gaps are concentrated in DataTable, DatePicker, CommandPalette,
and rich-content composition for interactive components.

This audit does not approve every missing capability for implementation. `CMUI-176` prioritizes the
gaps using real-consumer evidence; Phase 17 closes approved direct-replacement gaps. Application-owned
router behavior and retained icon ownership require recipes rather than framework-specific public
APIs in the shared contract.
