# Product quality and developer experience

The starting point is `c908b006`, whose product sources match the accepted `e4ff3dea` revision.
The historical design reference is `d9879116`. See [historical restoration](historical-restoration.md)
for the earlier acceptance and [stored visual renderer](stored-visual-renderer.md) for the limits
of local pixel comparisons.

## Findings register

P0 is a critical product defect; P1 blocks or substantially impairs supported use; P2 is a
bounded improvement with a clear benefit; P3 is optional. “Verified” means the fix was checked
as described in the finding. No reproducible P0 was found. Candidate-wide checks are tracked
separately.

| ID | Scope and reproduction | Evidence and impact | Correction and regression risk | Verification and status |
| --- | --- | --- | --- | --- |
| P1-01 | Vue installation: follow the unversioned install command in the 2.0 quick start | The checkout contains a draft 2.0 cohort, while the root README points to stable 1.1. The command does not select the package cohort used by the examples. | Separate stable installation from the built 2.0 tarballs. Documentation only. | Verified: installed fresh tarballs; compiled the Vue quick start and theme recipe from the guide with strict NodeNext. |
| P1-02 | Vue Select: associate a named control with a separate form, change it, then reset the form | Its hidden input has no form association and the widget does not reset with the form. Submission and displayed state can diverge from expectations. | Match the form ownership and reset behavior of Vue DatePicker and Vanilla Select. Keep the existing value and event contract. | Verified: real FormData association, canceled and uncanceled reset, model updates, and focus in the Vue regression tests. |
| P1-03 | Nested Accordion: use the same item keys in separate outer and inner instances, then navigate the inner triggers | A parent can handle keyboard input owned by its child. Vanilla also enumerates the nested items when building parent state. | Scope each adapter to its own triggers and panels. Verify that standalone and multiple-open accordions still work. | Verified: adapter regressions and trusted Chrome arrow navigation with identical keys. |
| P1-04 | Vanilla Select: focus Clear, then press Enter or Space; open with the selected option disabled | The root key handler consumes native button activation. The list can also focus a disabled option on entry. | Give Clear native activation and focus an enabled option on opening. Verify trigger and listbox keyboard behavior. | Verified: focused tests and trusted Chrome Enter and Space. |
| P1-05 | Both Popovers: put a hidden form input before the first visible action and open with ArrowDown | The focus target can be the hidden input, leaving focus on the trigger. | Use the focusability check for the first reachable control. Verify that ordinary focus entry stays in place. | Verified: adapter focus regressions and trusted Chrome ArrowDown in Vanilla. |
| P1-06 | Vanilla modal: dispatch a documented request on an inner same-kind modal | The request bubbles to the ancestor controller and can act on both modals. | Scope controller requests to their owning modal. Keep the public events bubbling. | Verified: nested dismissal regression and native Chrome dialog checks. |
| P1-07 | Distribution: run `npm run check:ui-registry-consumer` | The release cohort assertion fails before install because it omits Layouts. No complete release smoke can run. | Include Layouts in the manifest and Vue SSR/build checks. Verification code only. | Harness fixed; a mock install confirms all seven versions are selected. Live registry returns `ETARGET` for unpublished draft versions. |
| P1-08 | Both Tooltips: move the pointer from the trigger onto the tooltip; press Escape while focus is elsewhere | Pinned Chrome reproduced immediate dismissal across the gap and no hover-only Escape, including with a portal. The text cannot be hovered for reading or magnification. | Share placement logic and bridge the hit areas without moving the panel. Test portal positioning, focus and cleanup. | Verified with trusted input in both adapters for all four sides, inline and portaled. Extra Vanilla RTL cases passed. |
| P1-09 | Vue showcase: visit `/case.html?case=button-default` directly | Chrome stopped responding to evaluations; the case observed and repeatedly rewrote its own theme attribute. | Observe the owning frame document only; standalone uses the same storage policy without an observer on itself. | Verified: the same direct URL renders the Save example in pinned Chrome. |
| P1-10 | Vue native form controls: edit a populated text or choice control, then reset the form | Vue can overwrite the DOM defaults when a binding changes; a client-rendered textarea can reset to an empty default. Submitted values and application models can disagree. | Preserve authored defaults and update bound models after reset, without sending a synthetic native input or change event. Keep native exclusivity and historical radio types. | Verified: native Chrome FormData and model updates, plus Vue integration tests. An initially undefined Radio model needs the documented form-level reset because the existing radio event cannot carry undefined. |
| P2-01 | Theme onboarding: read the CSS and token guides, then use system dark with no authored attribute | The guides promise light by default; generated CSS already follows the system when dark is preferred. The theme recipe also rebuilds behavior supplied by the current adapters. | Document explicit modes, nested boundaries, persistence and server-first setup using the public Vue and runtime exports. Documentation only. | Verified: compiled the examples and rendered a checked Dark option from the cookie in packed Vue SSR. |
| P2-02 | Vanilla Switch: change a switch's form owner after mounting and reset its new form | A listener retained from the original owner can leave `aria-checked` stale. | Observe reset using the current form owner. Keep native form semantics and remove the listener on disconnect. | Verified: reassociation and teardown regressions plus native reset in Chrome. |
| P2-03 | Both showcases: open a contract example on a fresh origin with an OS dark preference | The page resolves to dark, but both iframe examples initially force light. | Frames inherit the page's preference and observe later changes. Theme behavior outside the contract frames stays the same. | Verified: both frames resolve system dark on first load and update after a page toggle. |
| P2-04 | Distribution: run `npm run pack:all:dry-run` | The command omits Icons and Layouts. A release check can pass without listing both archives. | Reuse the active workspace catalog and keep existing pack flags. Added verification cost only. | Verified: all seven archives listed and included in the packed consumer matrix. |
| P2-05 | Packed types: compile the ESM consumer under strict NodeNext | The historical suite checked it under Bundler resolution and skipped declaration checking in the CommonJS fixture. Package typing defects could escape CI. | Compile the ESM and CJS entries in strict NodeNext with declarations checked. Verification code only. | Verified on Node 22.22.3, 24.15.0 and 26.0.0. |
| P2-06 | Icons catalogs: navigate by heading | Neither Icons page has a first-level title. | Use real heading levels with the existing typography. | Verified: both pages expose the catalog as their first-level heading in Chrome. |
| P2-07 | Vanilla showcase: load a catalog page with scripts disabled on system dark | The generated document forces light before its script runs. | Let CSS resolve the initial theme. Users with a stored explicit preference still get it when the showcase initializes. | Verified: Chrome resolves the dark color scheme with the catalog's JavaScript disabled. |
| P2-08 | Both Icons catalogs: inspect a long icon name such as `arrowDownLong` at 390 px | The name and Copy button overflow into the next column. The controls are harder to read and distinguish. | Wrap long names in their cell and keep the Copy button at its normal size. Change only gallery styling. | Verified: all 109 visible system-icon Copy controls stayed within their cells in each adapter, and search exposed the empty state. |

## Coverage map

- [Canonical catalog](../../contracts/README.md): 62 manifests, 181 cases, and 72 interaction
  scenarios. The test matrix covers rendering and accessibility for the static components and
  checks documented keyboard, focus, and state changes on interactive examples where a scenario
  exists. Vue-specific exports and variants additionally use workspace and built package tests.
- The runtime review covers form controls and fieldsets, disclosure and navigation, overlays,
  data tables and column selection, shell layouts and measured regions, and the theme controller.
  The changes below the adapter boundary preserve Vanilla's independence from a rendering framework.
- The [Vue](historical-vue-core.md) and [Vanilla](historical-vanilla.md) contract traces give the
  per-component historical coverage and accepted platform differences, including native controls,
  who owns state, and what requires enhancement. They describe the earlier baseline.
- Automated accessibility and fixture comparisons do not establish screen reader behavior or
  complete WCAG conformance. Manual assistive-technology and non-Chromium testing are separate
  release follow-ups.
- The Tooltip correction addresses hoverability and dismissal in
  [WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).

| Canonical inventory | What the review covered |
| --- | --- |
| Button, IconButton, Link, Checkbox, DatePicker, Field, Fieldset, FormLayout, GroupBox, Input, Radio, Select, Switch, Textarea | Native semantics, name and value ownership, labelled and invalid states, validation/reset, and disabled controls. Vue props and models and Vanilla markup/controller requirements are documented separately where needed. |
| Accordion, Breadcrumbs, CommandPalette, Menu, MenuBar, NavMenu, Stepper, TableOfContents, Tabs | Keyboard entry and movement, disabled items, focus, routes and open state, responsive overflow, and active ARIA state. Shared behavior stays below the adapters. |
| Dialog, Drawer, Dropdown, Popover, Tooltip | Triggers and accessible names, focus entry/return, dismissal, nesting, positioning, reduced motion and exit paint. Native dialog retains its modality. |
| Alert, Avatar, Badge, Card, ColumnChooser, DataTable, Divider, Icon, Panel, ProgressBar, ProgressSpinner, Skeleton, SkeletonGate, Table, Tag | Semantic display or native table structure, geometry and tokens, empty/load feedback, selection, sorting and pagination. Static HTML remains usable without enhancement. |
| AdminLayout, AdminShell, AppShell, AsideArea, AuthLayout, Container, ContentArea, DocumentLayout, ErrorLayout, FooterArea, Grid, HeaderArea, Inline, PageHeader, Section, SetupLayout, SidebarArea, Stack | Shell regions and labels, density and spacing, narrow reflow and overflow, composition, and predictable CSS defaults. |
| ThemeSwitch | Shared semantic variables, explicit versus system mode, nested explicit previews, SSR and preference persistence. Vue owns state via a provider; Vanilla enhances a server-authored radio group. |

## Verification status

The final product revision is `1733d1f860b7b4bf123a4c7246cec56d914623c7`.

- The clean archive passed all 20 local checks: clean install, release audit, lint and formatting,
  types, documentation examples, repository and package contracts, accessibility on 181 canonical
  cases, 1,002 cold workspace tests, dependency and archive checks, and both production showcase
  builds. The standalone catalog contains 62 components and 369 examples and variants.
- The seven built packages matched a second build byte for byte. Fresh npm, pnpm, and Yarn Classic
  installs passed. The consumer checks cover strict NodeNext ESM and CommonJS, Node and Vite SSR,
  Vite browser builds, and 64 explicit shared CSS exports with no framework installed in the
  CSS-only fixture. Node 22.22.3, 24.15.0, and 26.0.0 passed the packed declaration and SSR checks.
- Gzip measurements: full Vue namespace 59.98/60 KiB, the historical namespace 80.58/81 KiB,
  runtime 79.98/80 KiB, and shared CSS 46.52/50 KiB. All aggregate and one-component budgets
  passed without changing the thresholds.
- Chrome for Testing 151.0.7922.138 passed all 144 keyboard, focus and state runs with equal motion
  signatures. All 362 Vue and Vanilla pixel pairs matched. All 96 local regression captures matched
  the equivalent local captures from the accepted product. The strict stored comparison still
  reports 44 of 48 PNGs per adapter on the local renderer. The current captures match the local
  reference at threshold zero, so this is the previously documented glyph residual. The stored
  PNGs and thresholds were unchanged.
- The 56 production showcase and standalone example checks at 390 and 1,280 px had no script
  errors, overall horizontal overflow, or unnamed frames. Both themes rendered and the Colors
  matrix measured all six displayed pairs per theme. Its narrowest text margin was 4.54:1 for
  selected text in light; interactive borders measured at least 3.18:1. These are the displayed
  pairings, not a full contrast audit of all compositions or custom themes.
- Independent reviews covered consumer installation and declarations, showcase theming, Vue
  form reset and nested Accordion in Chrome, Tooltip pointer movement and Escape, and the
  Drawer consumer's authored CSS variables.

Full release acceptance is pending. The available hosted result belongs to `e4ff3dea`. The
candidate needs a separately authorized verification ref for the hosted visual gate, and a live
registry smoke after the draft cohort is published. Follow up with screen reader and
non-Chromium testing; the automated checks do not prove WCAG conformance.
