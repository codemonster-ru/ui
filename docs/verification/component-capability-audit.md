# CodeMonster UI direct replacement capability audit

Status: Complete
Date: 2026-08-14
Roadmap item: `CMUI-172`

## Purpose

This audit compares the 37 direct replacements in the frozen VueForge migration map with the
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

| Replacement                   | Supported                                                                                                                                                                                           | Superseded or application-owned                                                                                                                                        | Missing portable capability |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfButton` → `CmButton`       | Native actions, submit/reset behavior, loading/disabled state, sizes, primary/secondary/danger/ghost variants, and icon regions                                                                     | `block` moves to layout/width utilities; feedback-only success/info/warn/help/contrast action colors are not Button variants; link mode is now explicit through `href` | None identified             |
| `VfCard` → `CmCard`           | Title, header/body/footer composition, compact density, forwarded attributes, and semantic root selection                                                                                           | Approved semantic element selection extends the legacy fixed `section` root                                                                                            | None identified             |
| `VfField` → `CmField`         | Label, description, error, invalid/required state, named content, and accessible control linkage                                                                                                    | Caller-owned stable control IDs replace Vue-generated IDs; floating labels are replaced by the single stable label structure                                           | None identified             |
| `VfInput` → `CmInput`         | Native text-like input types, Vue binding, server form values, sizes, disabled/readonly/required/invalid state, trusted leading/trailing content, localized clearing, and password reveal           | Native attributes are forwarded instead of duplicating their complete surface as props; masking and renderer-specific icon lookup remain outside the shared contract   | None identified             |
| `VfAccordion` → `CmAccordion` | Disclosure semantics, disabled items, controlled/uncontrolled open state, single/multiple mode, keyboard navigation, trusted per-item trigger/panel content, Vue interaction, and Razor enhancement | A collection contract replaces nested one-section component instances                                                                                                  | None identified             |

### Display components

| Replacement                 | Supported                                                                       | Superseded or application-owned                                                                                                                                            | Missing portable capability |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfAlert` → `CmAlert`       | Tones, title/body content, custom title and icon slots, semantic status content | Explicit icon composition replaces icon-name props; `warn` is named `warning`; the default moves from primary/alert to info/polite status with explicit urgent-role opt-in | None identified             |
| `VfAvatar` → `CmAvatar`     | Image/alt, label fallback, custom fallback content, sizes, and shapes           | The VueForge icon-name prop is replaced by the default composition boundary because icons remain a side-by-side product                                                    | None identified             |
| `VfBadge` → `CmBadge`       | Text content and all approved semantic tones                                    | `warn` is named `warning`                                                                                                                                                  | None identified             |
| `VfDivider` → `CmDivider`   | Horizontal and vertical semantic separators                                     | A native separator root replaces the legacy `div` and decorative horizontal mode                                                                                           | None identified             |
| `VfSkeleton` → `CmSkeleton` | Minimum height, animation, reduced-motion behavior, and radius variants         | Arbitrary radius strings are replaced by shared radius tokens; minimum height accepts only safe non-negative CSS lengths                                                   | None identified             |

### Native form components

| Replacement                 | Supported                                                                                                                         | Superseded or application-owned                                                                                             | Missing portable capability |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfCheckbox` → `CmCheckbox` | Boolean binding, value submission, label slot, size, invalid, disabled, required, indeterminate, and change behavior              | Native form submission and change events are authoritative; indeterminate uses the native property plus Razor enhancement   | None identified             |
| `VfRadio` → `CmRadio`       | Group value binding/submission, label slot, size, invalid, disabled, required, and change behavior                                | Native grouping, string serialization, and change events replace arbitrary scalar values and payloads                       | None identified             |
| `VfTextarea` → `CmTextarea` | String binding/submission, size, invalid, disabled, readonly, required, and forwarded native attributes                           | Native textarea attributes are authoritative; legacy floating-field context is replaced by the stable Field label structure | None identified             |
| `VfSwitch` → `CmSwitch`     | Boolean binding/submission, label slot, trusted decorative thumb content, size, invalid, disabled, required, and switch semantics | Reduced-motion CSS replaces `static`; shared tokens replace `thumbContrast`; native change events replace scalar payloads   | None identified             |

### Navigation components

| Replacement                       | Supported                                                                                                                                                               | Superseded or application-owned                                                                                                             | Missing portable capability |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfLink` → `CmLink`               | Native `href`, target/rel forwarding, safe `_blank` relationship, underline modes, tones, and content                                                                   | Router `to` and custom router component selection are application-owned; applications can apply `cm-link` styling to their router link      | None identified             |
| `VfBreadcrumbs` → `CmBreadcrumbs` | Native links, current/disabled items, accessible navigation label, and custom separator content                                                                         | Router destinations and router component resolution are application-owned                                                                   | None identified             |
| `VfMenu` → `CmMenu`               | Action/link items, rich per-item content, safe target/rel metadata, disabled/active/danger states, selection events, roving focus, Home/End/arrows, and Escape requests | Vue component instances are replaced by a portable collection with adapter-native authored content; icons remain a retained product         | None identified             |
| `VfDropdown` → `CmDropdown`       | Controlled open state, owned rich trigger, disabled state, two placements, menu selection, outside dismissal, keyboard opening, and focus restoration                   | In-place rendering and an owned Menu replace teleport, arbitrary menu bodies, and pills presentation; explicit state replaces `defaultOpen` | None identified             |
| `VfPopover` → `CmPopover`         | Controlled open state, owned rich trigger, disabled state, placement, outside/Escape dismissal, focus restoration, and rich panel body                                  | In-place rendering, fixed dismissal, and an owned accessible button replace teleport, policy toggles, and arbitrary trigger roots           | None identified             |
| `VfTabs` → `CmTabs`               | Tab semantics, controlled/default selection, rich labels and owned panels, disabled items, roving keyboard selection, and Razor enhancement                             | Stable IDs and internally owned panels replace caller IDs and externally owned panel relationships                                          | None identified             |

### Overlay components

| Replacement               | Supported                                                                                                                                                                     | Superseded or application-owned                                                                                                                       | Missing portable capability |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfDialog` → `CmDialog`   | Native modal semantics, trusted heading/description/actions/body/footer, finite sizes/dividers, controlled state, focus trap/restoration, Escape, and optional dismissal lock | Native `<dialog>`, in-place rendering, and explicit state replace teleport/scroll-lock targets and `defaultOpen`; backdrop activation never dismisses | None identified             |
| `VfDrawer` → `CmDrawer`   | Modal drawer semantics, trusted regions, finite sizes/dividers/rounding, start/end side, controlled state, focus handling, and dismissal lock                                 | Logical start/end replace left/right; block-axis drawers, arbitrary offsets/padding, teleport targets, and default state are not retained             | None identified             |
| `VfTooltip` → `CmTooltip` | Owned rich trigger, trusted non-interactive content, tooltip semantics, focus/hover lifecycle, Escape dismissal, logical placements, and tokenized delays                     | Token delays and in-place rendering replace arbitrary timing/teleport configuration; an owned button replaces arbitrary trigger roots                 | None identified             |

### Advanced input and data components

| Replacement                             | Supported                                                                                                                                                                                                                                                           | Superseded or application-owned                                                                                                                                                                                                                                                                          | Missing portable capability |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfSelect` → `CmSelect`                 | Native options, disabled options, placeholder, binding/submission, localized clear action, size, invalid, disabled, and required state                                                                                                                              | Native `<select>` replaces the custom teleported listbox, its placement API, and custom leading/trailing icons                                                                                                                                                                                           | None identified             |
| `VfDatePicker` → `CmDatePicker`         | Native single-date value, min/max, binding/submission, localized clear action, size, invalid, disabled, readonly, and required state                                                                                                                                | Native `input[type=date]` replaces the custom calendar, multiple/range and month/year/time modes, display formatting, calendar policy and labels, popup positioning, and teleport behavior                                                                                                               | None identified             |
| `VfCommandPalette` → `CmCommandPalette` | Controlled open/query state, filtering, disabled commands, keyboard navigation, selection, modal focus, localized loading/idle states, empty asynchronous collections, trusted regions and command content, and Razor enhancement                                   | A typed collection and owned option renderer replace arbitrary values/results, match highlighting, unmatched submit, and maximum-height controls; native `<dialog>` replaces teleport, default-state, and close-policy controls                                                                          | None identified             |
| `VfTable` → `CmTable`                   | Caption/header/body/footer composition, density, stripes, dividers, sticky header, semantic table structure, and responsive wrapper                                                                                                                                 | `density="compact"` replaces `compact`                                                                                                                                                                                                                                                                   | None identified             |
| `VfDataTable` → `CmDataTable`           | Portable text cells, caption, density/presentation, loading/error/empty states, controlled sorting, row eligibility and selection, page/page-size requests and summaries, ordered visible columns, complete interaction labels, Vue behavior, and Razor enhancement | Application-owned data operations replace built-in client sorting/pagination; string row IDs replace callback row keys; rich row composition, multi-sort query policy, and interactive reorder/resize/pin remain application-owned; CmTable plus CmSkeleton supersedes DataTable-specific skeleton modes | None identified             |

### Layout primitives

| Replacement                   | Supported                                                                            | Superseded or application-owned                                                              | Missing portable capability |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------- |
| `VfContainer` → `CmContainer` | Default/fluid widths, md/lg/xl/2xl sizes, semantic content, and forwarded attributes | `element` restricts the old arbitrary `as` value to the approved cross-platform semantic set | None identified             |
| `VfStack` → `CmStack`         | Vertical flow, semantic content, and forwarded attributes                            | `element` restricts arbitrary `as` to the approved semantic set                              | None identified             |
| `VfInline` → `CmInline`       | Inline flow, optional wrapping, semantic content, and forwarded attributes           | `element` restricts arbitrary `as` to the approved semantic set                              | None identified             |
| `VfSection` → `CmSection`     | Section flow, optional surface, semantic content, and forwarded attributes           | `element` restricts arbitrary `as` to the approved semantic set                              | None identified             |
| `VfGrid` → `CmGrid`           | Responsive grid flow, semantic content, and forwarded attributes                     | `element` restricts arbitrary `as` to the approved semantic set                              | None identified             |

### Portable expansion components

| Replacement                               | Supported                                                                                                                                                        | Superseded or application-owned                                                                                                                | Missing portable capability |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `VfFieldset` → `CmFieldset`               | Native named groups, trusted legend and supporting content, deterministic description/error relationships, invalid state, and adapter-native control composition | Caller-owned stable IDs and a required visible legend replace generated IDs and unnamed groups                                                 | None identified             |
| `VfIconButton` → `CmIconButton`           | Square native action, mandatory accessible label, trusted decorative icon content, finite variants and sizes, native type/disabled behavior, and root attributes | Authored icon content replaces the VueForge icon-name registry; link, loading, feedback variants, and implicit tooltip policy are not retained | None identified             |
| `VfProgressBar` → `CmProgressBar`         | Labelled determinate/indeterminate progress, bounded values, optional percentage text, semantic tones, reduced motion, and root attributes                       | Token-backed presentation replaces arbitrary height, stripes, and animation controls; `warning` replaces `warn`                                | None identified             |
| `VfProgressSpinner` → `CmProgressSpinner` | Labelled indeterminate progress, finite sizes and semantic tones, owned SVG geometry, reduced motion, and root attributes                                        | Finite token sizes and internal stroke geometry replace arbitrary size and stroke controls; `warning` replaces `warn`                          | None identified             |

## Outcome

All 37 direct replacements have a verified cross-platform baseline. Three replacements have an
application-owned integration that must remain visible during migration. The approved DataTable and
advanced-input gaps are closed; no direct replacement retains a missing portable capability.

This audit does not approve every missing capability for implementation. `CMUI-176` prioritizes the
gaps using real-consumer evidence; Phase 17 closes approved direct-replacement gaps. Application-owned
router behavior and retained icon ownership require recipes rather than framework-specific public
APIs in the shared contract.
