# VueForge: complete Design System audit and Phase 3 engineering hardening

Prepared: 2026-07-22. Status: **Phase 3 is complete; root-wide verification, package publication
dry-run, and Chromium visual smoke have passed**.

All automatable repository gates pass on the final worktree. The separately noted Firefox/WebKit,
native Windows High Contrast, native multi-engine browser zoom, and assistive technology checks are
not configured in the current repository and are explicitly left as post-RC platform certification
rather than represented as complete.

## 1. Executive summary

Phase 3 evaluated VueForge as a single public product rather than a collection of isolated Vue
components. The audit covered the public API, component contracts, CSS delivery, non-color tokens,
typography, layouts, motion, accessibility, responsive/RTL behavior, performance, documentation,
tests, SSR/hydration, browser constraints, and developer experience across every published package.

The system already had a strong foundation after Phases 0–2: a canonical theme contract, matching
runtime/static token maps, component-entry CSS, an OKLCH semantic color system, package consumer
smokes, and broad unit coverage. Before public release, however, observable defects—not cosmetic
issues—remained at subsystem boundaries:

- request-unstable SSR ids and several hydration mismatch scenarios;
- independent Escape/focus/scroll handlers in nested overlays;
- incorrect or incomplete ARIA relationships;
- a mismatch between runtime and TypeScript default exports for Layouts component subpaths;
- an SSR-unsafe CommonJS entry in Icons;
- ineffective tree shaking of the plugin singleton and an exceeded initial demo budget;
- incomplete iframe transport validation and infinite circular-import recursion in Playground;
- no shared reduced-motion/forced-colors contract and incomplete RTL support;
- documentation that described APIs which did not actually exist in several places.

Phase 3 fixed only defects with an objective effect on correctness, accessibility, SSR, performance,
package DX, or browser behavior. It did not introduce wholesale prop unification, DOM restructuring,
a new polymorphic trigger API, a universal i18n system, or other debatable architectural changes.

The Phase 2 color architecture was not revisited. Primitive/semantic palette values, their role
mapping, and public color token names are unchanged. The only theme preset change concerns stacking:
`dropdown`, `popover`, and `tooltip` now sit above the modal/drawer layer. The OKLCH literals added to
CodeBlock are standalone fallbacks for the same Phase 2 values, not a new palette.

Conclusion: VueForge's architecture and engineering discipline meet the standard of a mature public
UI library, and it is ready as an engineering release candidate. Full GA platform certification
remains a separate task: unit tests and Chromium smoke do not replace testing with real assistive
technologies, Firefox/WebKit layout engines, native Windows High Contrast, and native multi-engine
zoom at 200%/400%.

## 2. Architectural assessment of the library

### System map

```text
@codemonster-ru/vueforge-theme
  canonical theme types/runtime
              │
              ▼
@codemonster-ru/vueforge-core ───────► @codemonster-ru/vueforge-layouts
  components, providers,                layout primitives and shells
  composables, CSS artifacts
              │
              ├──────────────────────► @codemonster-ru/vueforge-codeblock
              │                          Shiki + standalone view entry
              │
              └──────────────────────► @codemonster-ru/vueforge-playground
                                         UI adapter
@codemonster-ru/vueforge-playground-core ─┘
  sandbox/runtime transport

@codemonster-ru/vueforge-playground-vite-plugin
  build-time virtual modules

@codemonster-ru/vueforge-icons
  independent ESM/CJS/UMD icon delivery
```

### Strengths

- Packages are separated by responsibility; the browser sandbox runtime is not mixed with the
  Playground UI.
- The Theme package remains the canonical contract, while Core owns preset/schema and CSS artifact
  generation.
- Core and Layouts provide a root entry, granular component subpaths, and explicit CSS entries.
- CSS artifacts are tested not only as source files but also as content of the built/packed consumer
  surface.
- Public types are mostly derived from actual Vue SFC declarations rather than maintained manually
  in a parallel model.
- SSR, hydration, package exports, no-`dist` tests, and consumer installation are treated as release
  contracts rather than local implementation details.
- Phases 0–2 established a robust color/token foundation; Phase 3 found no objective reason to change it.

### Architectural risks identified by the audit

The main recurring risk was at boundaries: source and packed package, server and browser, modal and
teleported child, internal tab and external tabpanel, full CSS and component entry. Code within
individual components was generally predictable, but independent local composables were unaware of
the global overlay stack, and package metadata sometimes disagreed with the runtime artifact.

Phase 3 did not add a new framework on top of the existing architecture. Instead, boundaries received
explicit contracts: active overlay arbitration, request-stable ids, packed declaration wrappers,
static import budgets, iframe message validation, and CSS parity assertions.

### Design System layer assessment

| Layer              | Assessment after changes                        | Rationale                                                                                                                                |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Theme/tokens       | Mature                                          | Canonical schema, runtime/static parity, and the Phase 2 contrast contract are preserved; the stacking contract received a targeted fix. |
| Core components    | Mature, with some v2 candidates                 | The API is broad and well tested; overlay, form, and ARIA defects were fixed without changing the component model.                       |
| CSS delivery       | Mature                                          | Full, manual, and auto/component-entry artifacts are tested; accessibility preferences are included in granular artifacts.               |
| Layouts            | Mature after fixes                              | Controlled state, grid grammar, full/component CSS parity, and subpath declarations now follow one contract.                             |
| CodeBlock          | Mature                                          | Standalone CSS, SSR highlight hydration, touch behavior, and public helper types are covered by package tests.                           |
| Playground         | Mature runtime; UI needs clearer code splitting | Transport/cycles/hydration/ARIA were fixed; a separate guaranteed-lazy public entry remains a recommendation.                            |
| Icons              | Mature                                          | ESM auto-CSS is preserved; SSR-safe CJS and an explicit style export are verified by packed consumer smoke.                              |
| Release automation | Substantially strengthened                      | CI runs repository `verify`; tree-shaking and initial graph budgets were added, but the visual/AT matrix remains outside CI.             |

## 3. Identified issues

Priorities in the table mean: **blocker**—a real risk to a correct public release; **high**—a
significant correctness/a11y/DX defect; **medium**—a localized consistency/browser issue. A status of
`Fixed` means the implementation and regression contract exist and the final root-wide run recorded
in section 12 succeeded.

| Priority | Area                    | Observed defect before Phase 3                                                                                                              | Status                        |
| -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Blocker  | SSR ids                 | `useId` used a module-global counter: the sequence depended on previous requests and could diverge during hydration.                        | Fixed                         |
| Blocker  | Theme hydration         | The Provider read storage/media during browser setup while the server used a fallback; the first render was nondeterministic.               | Fixed                         |
| Blocker  | Playground hydration    | Module-level `typeof window` made server/client preview branches differ before mount.                                                       | Fixed                         |
| Blocker  | CodeBlock hydration     | The server could return Shiki HTML while the client started with plaintext and replaced the server DOM with a hydration warning.            | Fixed                         |
| Blocker  | Overlay coordination    | Each overlay listened for Escape and Tab independently; one Escape could close multiple levels, while multiple focus traps competed.        | Fixed                         |
| Blocker  | Scroll locking          | Two modal owners overwrote body styles, and the first unlock could release the second owner's lock.                                         | Fixed                         |
| Blocker  | Layouts package types   | A component subpath's runtime default exported the component, but `types` pointed to the root declaration with the plugin default.          | Fixed                         |
| Blocker  | Icons CommonJS/SSR      | `main` pointed to a UMD artifact with CSS DOM injection; `require()` needed an artificial `document`.                                       | Fixed                         |
| Blocker  | Icons clean publication | A clean `npm pack` did not build a missing `dist`, so the tarball could omit declared CJS/CSS/declaration artifacts.                        | Fixed                         |
| Blocker  | Tree shaking            | An unannotated plugin factory call retained theme/application runtime when importing one component.                                         | Fixed                         |
| Blocker  | Demo budget             | The initial demo entry was 95.90 KiB gzip against a 95.00 KiB contract because the Playground plugin was unnecessarily installed globally.  | Fixed                         |
| Blocker  | Playground imports      | Direct/indirect circular imports recursed instead of returning a structured runtime error.                                                  | Fixed                         |
| High     | Playground transport    | `postMessage` was accepted by marker without validating `event.source` or the runtime payload shape.                                        | Fixed                         |
| High     | Playground memory       | Console history and individual entry length had no upper bound.                                                                             | Fixed                         |
| High     | Dialog/Drawer semantics | Custom header/description slots could leave dangling `aria-labelledby`/`aria-describedby`; an explicit label did not reach the role node.   | Fixed                         |
| High     | Tabs/Playground         | `VfTabs` always declared `aria-controls`, even when no panel existed; Playground external panels lacked stable bidirectional IDREFs.        | Fixed                         |
| High     | Command Palette         | The search input lacked a complete combobox contract and `aria-activedescendant`; status changes were not announced through a live region.  | Fixed                         |
| High     | Select                  | Keyboard navigation indexed disabled options, and a disabled Select still submitted a hidden form input.                                    | Fixed                         |
| High     | SkeletonGate            | Visually hidden content remained focusable and interactive during the loading state.                                                        | Fixed                         |
| High     | ThemeSwitch             | A Switch without a visual label had no default accessible name.                                                                             | Fixed                         |
| High     | AppShell state          | Controlled `sidebarCollapsed` was mutated locally, and the `update` emit occurred during initial render.                                    | Fixed                         |
| High     | AppShell CSS            | The component entry contained an invalid area `grid-template` shorthand and diverged from the full stylesheet.                              | Fixed                         |
| High     | Browser preferences     | There was no shared forced-colors and reduced-motion contract across all Core component artifacts.                                          | Fixed                         |
| High     | Command Palette zoom    | The `85vh` max-height ignored the top offset and bottom viewport padding; at effective 400% zoom, content extended beyond the viewport.     | Fixed                         |
| High     | Overlay stacking        | Dropdown/popover/tooltip layers `900/925/950` sat below the modal/drawer layer `1000`, including teleported descendants.                    | Fixed                         |
| High     | CodeBlock standalone    | The token entry referenced Core variables without terminal fallbacks; a standalone dark root could lose due to specificity.                 | Fixed                         |
| High     | CI                      | The workflow ran an incomplete subset of checks and did not protect tree shaking.                                                           | Fixed                         |
| High     | Documentation           | The Core plugin, CodeBlock helpers/types, Layouts exports/props, and Playground props/resolver were described inaccurately or incompletely. | Fixed                         |
| Medium   | Public typings          | Several genuinely public composable option types and component unions were absent from root exports.                                        | Fixed                         |
| Medium   | Naming                  | The Vite plugin published types using `Vueforge` instead of the product spelling `VueForge`.                                                | Fixed with compatible aliases |
| Medium   | RTL                     | Switch geometry, menu keyboard direction, and several physical CSS properties were not mirrored.                                            | Fixed in confirmed components |
| Medium   | Motion                  | Button/IconButton/Input/Select/Textarea used different literal durations/easing instead of motion tokens.                                   | Fixed                         |
| Medium   | Touch                   | The CodeBlock copy action relied on hover and could remain hidden on a coarse pointer.                                                      | Fixed                         |
| Medium   | Peer contract           | Layouts, CodeBlock, and Playground declared Vue 3.4, although the actual dependency graph and new SSR contracts require Vue 3.5.            | Fixed at `^3.5.0`             |
| Medium   | Clean consumer tests    | The no-`dist` script hid only some workspace artifacts, so some tests could accidentally read a stale build.                                | Fixed                         |
| Medium   | Generated CSS race      | Parallel Core workers wrote one generated stylesheet directly; another worker could read partially written CSS.                             | Fixed                         |
| Medium   | Showcase zoom           | The no-wrap typography fixture caused 81 px of document-level horizontal scroll at effective 400% zoom.                                     | Fixed                         |

The audit also identified architectural opportunities that should not be introduced as targeted
pre-release patches. They are listed in section 6 and are not presented as “fixed.”

## 4. Fixed issues

### Core runtime, SSR, and overlays

- `useId` now uses Vue 3.5 `useId`; a consumer-provided id still takes precedence. Two independent
  SSR renders now receive the same request-local sequence.
- `VfThemeProvider` starts the server and first client render with the same configured mode. Storage,
  DOM attributes, and `matchMedia` are read after mount; blocked storage and missing/failing
  `matchMedia` are handled without crashing.
- `useBreakpoint` creates the media query only after mount and safely returns an initial `false` for SSR.
- `useEscapeKey` uses an active stack for `keydown` and `keyup`; only the most recently activated
  handler receives the event, and `defaultPrevented` is respected.
- `useFocusTrap` coordinates a single topmost trap. Select, Dropdown, Popover, and MenuBar register
  teleported focus branches, so they remain part of the active modal scope.
- `useScrollLock` uses an owner count for each `HTMLElement`, preserves original inline styles, and
  works correctly with non-LIFO unmount. `VfDrawer scrollLockTarget=false` now actually disables locking.

Regression coverage: request-stable SSR ids, nested Escape LIFO, topmost/teleported focus scope,
concurrent scroll owners, ThemeProvider hydration, and browser API failure paths.

### Component semantics and keyboard behavior

- Dialog gained additive `ariaLabel`, `ariaLabelledby`, and `ariaDescribedby`; Drawer gained
  `ariaLabel` and `ariaLabelledby`. Generated ids now physically wrap custom slot content, and an
  explicit label has predictable precedence.
- `VfTabs` no longer creates dangling `aria-controls` without a panel. Additive
  `VfTabItem.tabId/panelId` fields connect external panels; Playground applies this contract to main
  and file tabs.
- Command Palette implements `combobox` + `listbox` relationship, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `aria-autocomplete`, busy state, and polite status regions.
- Select excludes disabled options from the roving keyboard list, selects an option from the same
  filtered set, gives options `tabindex=-1`, and disables the hidden form input with the control.
- SkeletonGate declares `aria-busy`, while unready content receives `inert` and `aria-hidden`.
- ThemeSwitch without visible content receives a default action label such as “Switch to dark theme.”
- MenuBar mirrors horizontal/submenu Arrow behavior in RTL; relevant physical CSS properties were
  replaced with logical properties in Switch, NavMenu, TableOfContents, Accordion, Select, and menu surfaces.

### CSS, motion, and browser preferences

- The new `accessibility-preferences.css` is included in the Core full stylesheet and every generated
  standalone component artifact. Contracts require `prefers-reduced-motion` and `forced-colors` in every
  artifact.
- Under reduced motion, CSS transitions/animations are shortened, the horizontal scroller uses
  `behavior: auto`, CodeBlock disables the copy transition, and Icons disable the spin animation.
- Forced-colors rules preserve a distinguishable focus outline, checked-control boundary/mark, and disabled cue.
- Command Palette max-height is now constrained by both the component limit and available viewport
  height after the top offset/bottom padding (`vh` fallback + `dvh`), so 400% zoom does not clip content;
  `check:css-parity` establishes both viewport bounds as a permanent regression contract.
- Literal control transitions were replaced with `--vf-motion-duration-fast` and
  `--vf-motion-ease-standard`.
- `zDropdown`, `zPopover`, and `zTooltip` changed from `900/925/950` to `1100/1125/1150`; modal/drawer
  remain at `1000`.
- Full/component CSS contracts test AppShell grid grammar, longhand parity, and subheader rule parity.
- The showcase no-wrap typography fixture received local horizontal scrolling and no longer expands
  the document; the public `vf-text-nowrap` utility itself is unchanged.

### Layouts

- `VfAppShell` now follows the standard controlled/uncontrolled contract: the controlled prop remains
  the source of truth, uncontrolled state starts from `defaultSidebarCollapsed`, and an emit occurs
  only for a real user/API request.
- The invalid `grid-template` was replaced with `grid-template-areas/rows/columns`; the component entry
  is synchronized with the full stylesheet. Subheader uses the same `block-size` contract in both paths.
- All 17 component subpaths received dedicated declaration wrappers with matching named/default
  component exports. A packed TypeScript consumer compiles the real prop contracts.
- The plugin singleton is marked pure for tree shaking.

### CodeBlock

- The SSR Shiki result is preserved during hydration. `data-allow-mismatch="children"` is limited to
  line content; Vue continues to validate component attributes/classes. After mount, reactive state
  synchronizes with server-rendered tokens.
- All external token dependencies received terminal fallbacks using current Phase 2 values; the
  standalone light/dark root works without Core CSS.
- The copy action is visible and at least 44×44 px on a coarse/touch pointer; its reduced-motion
  transition is disabled.
- `CodeBlockFallbackLanguage` and `CodeBlockHighlightOptions` became public; highlight entry and
  root/view declarations agree with the implementation.
- API docs were corrected to match actual signatures, props, the language union, standalone CSS, and Vue peer.

### Playground and Playground Core

- Browser-only state becomes `true` only in `onMounted`, preserving SSR/client first-render parity;
  the session is not created until the client and iframe exist.
- Main/file tabs have stable ids and real external tabpanels.
- The console retains at most the latest 500 entries; each entry is limited to 16,384 characters.
- The session accepts messages only from the configured iframe `contentWindow` and after structural validation of the
  console/error payload.
- Direct and indirect circular imports return a deterministic `circular` error with the import path.
- The UI root exports all public prop unions/interfaces; the Vite plugin gained correctly cased
  `VueForge*` aliases while retaining deprecated `Vueforge*` names.
- Documentation is synchronized for `heightMode` and synchronous `resolveImport`.

### Packaging, performance, and release automation

- Core and Layouts plugin factory calls are marked `/* @__PURE__ */`.
- The demo no longer installs the Playground plugin globally when it uses only a local async
  component.
- The static manifest gate forbids Playground UI/runtime and Shiki in the initial graph and preserves route-level
  deferred loading.
- A new packed-style tree-shaking gate imports one Core/Layout component, checks the gzip budget, and
  forbids accidental inclusion of palette/theme application runtime.
- Icons now publishes an SSR-safe CJS artifact, ESM auto-CSS, and explicit `./style.css`. `prepack`
  guarantees these artifacts are built from a clean checkout, while a packed CJS consumer proves the absence of
  DOM/CSS require side effects.
- Core generated theme CSS is written through a process-local temporary file and atomic rename.
  Parallel Vitest/build workers can no longer observe a partially written artifact.
- The no-`dist` test script temporarily removes `dist` from every package/example workspace; Core and
  Layouts CJS smokes independently pack and load Icons without relying on a workspace artifact.
- CI runs the full `npm run verify`, followed by dry-run package publication for all eight packages.

## 5. Why they mattered

| Defect                              | Actual failure mode                                                                                                                    | Why it could not be deferred                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Global SSR id counter               | Different IDREFs across requests/server/client, hydration warnings, and incorrect labels.                                              | A basic SSR correctness contract for a public Vue library.                                   |
| Independent overlay handlers        | One Escape closes parent and child; Tab jumps between competing traps; the background may unlock.                                      | Loss of keyboard predictability and modal isolation.                                         |
| Hydration drift                     | Vue replaces server DOM, loses ready Shiki markup, or reports a mismatch.                                                              | Affects Nuxt/Vite SSR, performance, and trust in server output.                              |
| Dangling ARIA IDREF                 | A screen reader cannot find the name, description, or controlled panel.                                                                | Semantics appear present in the DOM but do not actually work.                                |
| Layout subpath type mismatch        | The runtime import works, but TypeScript treats the default export as the plugin and reports incorrect props.                          | Blocks normal consumer DX and makes the package export untrustworthy.                        |
| Invalid grid shorthand              | The browser may discard the entire declaration; granular CSS behaves differently from full CSS.                                        | Layout correctness depends on the import method.                                             |
| Iframe source/payload trust         | A foreign frame can spoof console/error; a malformed payload breaks host assumptions.                                                  | Playground executes untrusted code and must validate its transport boundary.                 |
| Circular import recursion           | Stack overflow/unpredictable error instead of a diagnosable sandbox failure.                                                           | A user error must not destroy the host runtime.                                              |
| CJS DOM CSS injection               | SSR `require()` fails without a fake `document`.                                                                                       | A published CommonJS condition must be server-safe.                                          |
| Clean pack without build lifecycle  | `npm pack`/`npm publish` from a clean checkout can emit a tarball without files referenced by exports.                                 | The published manifest must be reproducible from source, not depend on a local stale `dist`. |
| Plugin tree-shaking failure         | One component import retains an unrelated theme graph and localStorage runtime.                                                        | Violates the declared granular delivery model and bundle expectations.                       |
| Non-atomic CSS generation           | A parallel test/build reads a truncated generated file and gets a random parity failure.                                               | A flaky contract hides real regressions and makes CI nondeterministic.                       |
| Reduced motion/forced colors        | Animation continues despite the user preference; focus/checked cues may disappear in HC.                                               | This is a platform accessibility contract, not a visual option.                              |
| Overlay viewport overflow           | Command Palette extends below the visual viewport at 400% zoom; footer/results become inaccessible without a predictable scroll scope. | WCAG reflow must preserve operable content in a short effective viewport.                    |
| Hidden interactive skeleton content | The keyboard reaches invisible controls before the UI is ready.                                                                        | Breaks focus order and creates an inaccessible state.                                        |

Selection was conservative: if an issue could not be demonstrated through a failure mode and
regression contract, it did not become part of the patch. Phase 3 therefore did not become a
subjective redesign.

## 6. Remaining recommendations

The deliberately deferred changes are listed below. They are not hidden unfinished parts of the patch:
they require a separate product/API decision, migration policy, or real browser/AT infrastructure.

| Priority | Recommendation                                                                                                             | Why it was not included in Phase 3                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Add a separate guaranteed lazy Playground entry, for example `./async`, and measure its consumer graph.                    | The current `/ui` simultaneously re-exports the sync component; It is better to issue changes to entry architecture and documentation as a separate additive contract. |
| P1       | Launch the permanent Playwright matrix: Chromium, Firefox, WebKit, LTR/RTL, reduced motion, forced colors, 200%/400% zoom. | Unit/JSDOM and one-time visual smoke do not prove the layout/paint behavior of all engines.                                                                            |
| P1       | Carry out a manual screen-reader pass: VoiceOver/Safari, NVDA/Firefox or Chromium, JAWS/Edge.                              | Accessible DOM contracts are covered by tests, but announcement/focus UX cannot be certified by a unit test.                                                           |
| P1       | Define official docs-site build and broken-link gate.                                                                      | The repository has Markdown lint/import ownership and demo build, but there is currently no separate documentation site build command.                                 |
| P1       | Document SSR theme bootstrap to eliminate possible first-paint switch with stored/system theme.                            | Provider is now hydration-safe; the complete absence of flash requires a server cookie/inline bootstrap policy at the application level.                               |
| P2       | Design a single polymorphic trigger/`asChild` contract for overlay/actions.                                                | Changes DOM ownership, ref forwarding, events and public API; a targeted implementation would create another convention.                                               |
| P2       | Design a localization provider for built-in labels/status text.                                                            | Hardcoded English strings exist; a secure solution requires fallback locale, typing and message ownership, not disparate props.                                        |
| P2       | Define a generic row typing/sorting/selection model for the DataTable.                                                     | This is a new product API, not a fix for an existing defect.                                                                                                           |
| P2       | Fix Alert role/live-region policy and mandatory non-color cues for custom content.                                         | Severity does not always mean urgent announcement; automatic `alert` may worsen the UX.                                                                                |
| P2       | Bring bidi spatial behavior scrollers/floating placement to the entire component set.                                      | Confirmed physical CSS and MenuBar keyboard defects have been fixed; A full bidi audit requires a browser matrix and product policy for logical placement names.       |
| P2       | Decide the fate of `critical.css` as a public long-term contract.                                                          | Removing or redefining entry is a migration/bundling solution.                                                                                                         |
| P2       | Expand Select to a full native-like form contract: reset, validation, required and form association.                       | Current disabled submission defect has been fixed; full-fledged native select emulation significantly expands the API/implementation.                                  |
| P2       | Consider a scoped CodeBlock style registry instead of repeated runtime theme injection.                                    | Measurements across multiple providers/scopes are needed; the current implementation is correct, and no performance blocker has been demonstrated.                     |
| P2       | Go to cascade layers only in major release with documented consumer ordering.                                              | Adding `@layer` can change the existing cascade and override behavior even without changing selectors.                                                                 |
| P3       | Publish deprecation/migration roadmap for previously noted Phase 1 compatibility tokens and legacy APIs.                   | Phase 3 does not remove legacy contracts; the plan is needed before major, and not as a pre-release patch of the current line.                                         |

A separate risk of the current token-only stacking fix is that the global dropdown layer is now above
the modal layer regardless of ancestry. This fixes the confirmed case of a teleported child inside a
modal, but the ideal long-term model is a stack manager/top-layer context that distinguishes a
foreground branch from an unrelated background popup.

## 7. Performance

### Confirmed problems and results

| Contract                               |                        Before Phase 3 | After correction | Status                 |
| -------------------------------------- | ------------------------------------: | ---------------: | ---------------------- |
| Demo initial entry gzip                |                             95.90 KiB |        90.24 KiB | PASS, budget 95.00 KiB |
| Core root import only `VfButton`       |    About 12.3 KiB gzip in audit probe |    1.11 KiB gzip | PASS, budget 4 KiB     |
| Layouts root import only `VfContainer` | About 15.4 KiB of gzip in audit probe |    0.65 KiB gzip | PASS, budget 4 KiB     |

The post-fix numbers were reproduced by automated gates after the final root build. The gate also
searches the output for unrelated OKLCH palette declarations, the primitive graph, and theme
application runtime, so a small gzip size is not the only criterion.

Initial manifest is checked transitively: Shiki, `@shikijs`, Playground UI and Playground Core cannot
enter the root static import graph. Core/Layouts/Icons routes must not pull in deferred runtime either.
Removing the global Playground plugin installation does not change demo functionality because the
showcase already uses a local async component.

Console bounds in Playground eliminate unbounded reactive-array and DOM-text growth: the latest 500
entries are retained, each up to 16,384 characters. Circular import detection also replaces a
potential stack overflow with linear diagnostics of the active compile path.

### Remaining performance observations

- `VfPlaygroundAsync` should be checked through a separate public async entry; export from the shared
  `/ui` entry should not be considered proof of hard code splitting.
- The visual showcase budget protects the initial graph but does not replace budgets for each
  published package entry and typical composite consumers.
- Real browser measurements of hydration/interaction are needed if the library will make specific claims
  Core Web Vitals guarantees; Phase 3 measures bundle contracts, not marketing runtime metrics.

## 8. Accessibility

Phase 3 closes confirmed programmatic defects in keyboard/focus/ARIA layers:

- topmost Escape and focus trap for nested/teleported overlays;
- ref-counted scroll isolation;
- correct accessible name/description ids for Dialog and Drawer custom slots;
- combobox/listbox/active descendant contract for Command Palette;
- two-sided tab/tabpanel relationships and no dangling `aria-controls`;
- omission of disabled Select options and absence of disabled form submission;
- `inert` loading content from SkeletonGate;
- default accessible name for ThemeSwitch;
- polite live statuses for loading/empty Command Palette;
- RTL keyboard direction for MenuBar;
- reduced motion, forced colors and coarse pointer behavior.

The forced-colors contract uses system colors (`Highlight`, `HighlightText`, `Canvas`, `ButtonText`,
`GrayText`) and removes the conflicting box-shadow from focused controls. The reduced-motion contract
does more than slow animation: the scroller switches to instant behavior, and icon spin stops.

Automated tests confirm DOM relationships and keyboard event routing. Chromium reflow smoke
additionally confirmed 200%/400% effective viewport without document-level horizontal overflow on Core,
Layouts, CodeBlock and Playground; modal surfaces remain within the boundaries, touch copy target is 44x44 px.
This still does not allow you to claim full WCAG certification. Before the GA release, you need a manual pass from section 6.
In particular you should check:

- announcement cadence Command Palette status regions;
- nested Dialog → Select/Popover/Menu focus flow in VoiceOver/NVDA;
- Windows High Contrast rendering Checkbox/Radio/Switch;
- repeat native browser zoom 200%/400% in Firefox/WebKit/Windows, including browser chrome and OS scaling;
- touch exploration and copy action on iOS/Android;
- custom renderer/slot cases, where the consumer takes on semantic ownership.

Phase 3 did not change the Phase 2 contrast matrix and did not adjust the color values. All previously recorded
non-color cue exceptions remain in effect; new forced-colors layer enhances platform mode, but not
replaces product-level icon/text cues.

## 9. DX

DX has been improved where the consumer received an objectively incorrect or incomplete contract:

- Layouts subpath autocomplete now shows props of a specific component, not plugin type.
- Core root exports `VfLinkUnderline`, `VfSwitchThumbContrast` and option types public composables:
  `UseClickOutsideOptions`, `UseDisclosureOptions`, `UseEscapeKeyOptions`, `UseFloatingOptions`,
  `UseFocusTrapOptions`, `UseIdOptions`, `UseTableOfContentsOptions` and middleware data.
- Playground UI exports shared/sandbox/component props, tab and height-mode types.
- CodeBlock highlight options/fallback type are available from root, view and highlight entries.
- Vite plugin fixes product casing through new aliases, keeping old names as deprecated.
- Packed consumer tests compile real imports and intentional `@ts-expect-error`, so the presence
  `.d.ts` of a file is no longer considered a sufficient check.
- Core docs no longer promise global component registration: plugin is responsible for theme/config defaults,
  and components are imported directly.
- Vue peer contract reduced to actual minimum `^3.5.0` in Layouts, CodeBlock and Playground.

### Migration notes

- The transition peer Vue `^3.4.0` → `^3.5.0` is the only intentional increase in the platform minimum. It
  necessary for request-stable `useId`, narrow hydration mismatch control and coordination with already
  requiring Vue 3.5 Core/Icons. Consumers on Vue 3.4 should update Vue before installing new versions.
- CommonJS Icons no longer performs CSS DOM injection. SSR `require()` is now safe; CommonJS
  A browser consumer that needs package styles must import the published `style.css`.
  ESM auto-CSS behavior saved.
- Controlled AppShell no longer emits initial value and does not change visual state before updating prop
  parent. This is a fix for the standard controlled contract; code that relied on mount emit should
  initialize parent state explicitly.
- Old `Vueforge*` Vite plugin types have not been removed, so source compatibility is preserved.

## 10. API consistency

Phase 3 did not rename existing component props/events/slots or introduce a parallel naming system.
Public API fixes are additive or restore the implementation to the already documented contract.

| Change                                 | Compatibility                       | Comment                                                               |
| -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Dialog/Drawer aria props               | Additive                            | Existing title/description defaults saved.                            |
| `VfTabItem.tabId/panelId`              | Additive optional fields            | Existing internally rendered panels receive generated ids as before.  |
| Core composable/component type exports | Additive                            | Runtime behavior does not change.                                     |
| CodeBlock public option types          | Additive                            | Types describe already existing runtime options.                      |
| Playground prop type exports           | Additive                            | Props already existed in implementation.                              |
| Correctly cased Vite plugin aliases    | Additive + deprecated compatibility | Legacy spelling preserved.                                            |
| Layouts dedicated subpath declarations | Corrective                          | Types now match the already existing runtime default export.          |
| AppShell controlled state              | Behavioral bug fix                  | Removed unsolicited initial emit; parent remains the source of truth. |
| `scrollLockTarget=false`               | Behavioral bug fix                  | The value now matches its public meaning.                             |
| Vue 3.5 peer minimum                   | Platform requirement change         | An objectively necessary exception, described in the migration notes. |
| Icons CJS entry/style export           | Packaging correction                | Runtime symbols saved; CSS side effect is separated for SSR.          |

No wholesale unification of `as`/`asChild`, `position`/`placement`, content rendering, or localization
props was attempted: without a major-version design, it could reduce rather than improve API
consistency. Those decisions are deferred to section 6.

## 11. Documentation

The documented discrepancies were corrected:

- Core installation/getting-started/API/guides accurately describe the theme/configuration plugin and direct
  component imports;
- CodeBlock API contains real helper argument order, `highlightCodeLines`, preload/plain helpers,
  options, props, the full language union, standalone CSS, and a hydration note;
- Layouts API lists `VfAdminShell`, CSS breakpoints, AppShell/DocumentLayout props and payload emit;
- Playground API describes `heightMode`, public types and the exact synchronous `resolveImport` contract;
- peer Vue minimum in CodeBlock docs is synchronized with package metadata.
- The typography showcase preserves the meaning of the no-wrap utility but contains its overflow
  locally instead of expanding the entire page at 400% zoom.

Docs import ownership continues to prevent examples that accidentally use the wrong package
entry. Markdown lint remains a content-level gate.

Objective remaining gap: the repository does not define a separate documentation-site build command.
`npm run build:demo` builds the showcase, not a static docs portal. Therefore “documentation build” is
marked as not configured in the final verification table; this should be addressed before claiming
public hosted documentation with a broken-link guarantee.

A separate migration guide Phase 3 is needed when publishing release notes, primarily for Vue 3.5 minimum,
Icons CJS CSS and controlled AppShell mount emit. This audit report records changes technically, but not
replaces the short consumer-facing changelog.

## 12. Test coverage

### Fixed baseline before changes

- `npm test`: 420 tests — PASS.
- `npm run typecheck`: PASS.
- `npm run lint:all`: PASS.
- Docs import ownership: 284 Markdown files — PASS.
- Deferred demo budget: **FAIL**, 95.90 KiB gzip > 95.00 KiB. This baseline failure has become separate
  regression contract, and was not hidden by an increase in the budget.

### Confirmed checks of ongoing changes

| Scope                             | Result          | Which confirms                                                                                                                                     |
| --------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs import ownership             | PASS, 285 files | Each snippet uses the correct package entry.                                                                                                       |
| Core package `check`              | PASS, 268 tests | SSR ids/provider, overlay/focus/scroll, runtime/static parity, Command Palette viewport bound, 43 CSS exports and 39 component auto-CSS contracts. |
| Layouts package `check` + build   | PASS, 56 tests  | State behavior, CSS grammar/parity, 21 CSS exports, 17 JS and 17 declaration subpaths, packed TS consumer.                                         |
| CodeBlock package `check` + build | PASS, 53 tests  | SSR hydration, standalone tokens, public types, CSS/export/packed consumer.                                                                        |
| Playground UI package `check`     | PASS, 35/35     | Hydration, external tabpanels, bounded logs, props/export behavior.                                                                                |
| Playground Core package `check`   | PASS, 15/15     | Message validation, source isolation, circular imports/runtime.                                                                                    |
| Playground Vite plugin `check`    | PASS, 6/6       | Virtual entries and compatible type aliases.                                                                                                       |
| Theme package `check`             | PASS, 13/13     | Theme types/runtime and serialization contracts.                                                                                                   |
| Icons check/build/packed CJS SSR  | PASS            | CJS without DOM/CSS require, ESM CSS reference, explicit style export and SSR rendering.                                                           |
| Consumer Tree-Shaking Gate        | PASS            | Core `VfButton` 1.11 KiB gzip; Layouts `VfContainer` 0.65 KB gzip; unrelated theme graphic images.                                                 |
| Deferred runtime budget           | PASS            | Demo initial entry 90.24 KiB gzip; forbidden deferred runtimes are missing from the initial static graph.                                          |

### Final verification table

| Required verification                     | Status           | Final certificate                                                                                                        |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                                | PASS             | 446 Vitest tests in all test-bearing packages; Icons consumer/render assertions also PASS.                               |
| `npm run verify`                          | PASS             | Clean install (630 packages), lint, package checks, no-dist tests, build, tree shaking and budgets in one command.       |
| `npm run typecheck`                       | PASS             | All workspace TypeScript/Vue declarations.                                                                               |
| `npm run lint:all`                        | PASS             | ESLint, Stylelint, HTMLHint, Markdownlint (287 Markdown files) and Prettier data.                                        |
| `npm run build`                           | PASS             | All eight library packages, including ESM/CJS/declarations/CSS artifacts.                                                |
| `npm run build:demo`                      | PASS             | Production showcase/demo build; route runtimes typically deferred.                                                       |
| CSS exports + full/component-entry parity | PASS             | Core/Layout/CodeBlock/Playground packed CSS contracts on final dist.                                                     |
| Runtime/static theme parity               | PASS             | Canonical runtime/static variable maps and scoped modes are the same; color values are not changed.                      |
| SSR/hydration aggregate                   | PASS             | Vue server-renderer regressions, clean packed Core/Layout/Icons CJS SSR and hydration cases.                             |
| Visual regression light/dark/reflow       | PASS (Chromium)  | 24 screenshots; additionally 12 checks (200%, 400%, ultrawide × 4 routes), 3 overlays at 400% and coarse-pointer target. |
| Documentation build                       | `NOT_CONFIGURED` | There are Markdown/import gates; There is no separate docs-site build command in the repository.                         |
| `npm run prepublish:all`                  | PASS             | Dry-run archives of all eight published packages contain CJS/ESM/CSS/declarations according to exports.                  |
| `git diff --check`                        | PASS             | Whitespace integrity of the final Phase 3 diff.                                                                          |

The PNG container hashes between the two visual runs differed due to the encoder metadata. Comparison of decoded
pixels showed an exact match of all Core, CodeBlock and Playground frames. In seven Colors/CVD frames
no more than 0.01793% of pixels differed; the palette and layout have not changed visually, maximum differences
localized in repeated raster/CVD capture and verified by manual review. Browser/network errors: 0.

The main new regressions check exactly the detected causes, and not random snapshots: two
independent SSR requests, nested overlay ownership, non-LIFO scroll unlock, malformed foreign iframe
messages, circular path, packed default/type identity, standalone token terminals and static bundle graph.

## 13. Browser compatibility

### Fixed cross-browser/platform contracts

- Browser-only APIs (`localStorage`, `matchMedia`, media listeners, DOM roots) are protected and not executed
  in SSR setup path.
- Storage SecurityError/privacy restrictions do not break ThemeProvider.
- `prefers-reduced-motion`, `prefers-color-scheme` and `forced-colors` have explicit fallback behavior.
- Physical left/padding/margin properties replaced with logical equivalents in affected bidi components;
  MenuBar keyboard direction takes into account the nearest `dir` and root direction.
- Coarse pointer no longer depends on hover for CodeBlock copy.
- Icons CommonJS does not assume browser DOM.
- AppShell uses valid grid longhands, the same in full and component CSS.

### What is proven and what is not

Unit tests and package builds prove deterministic DOM/API behavior, but JSDOM is not Chrome,
Firefox or Safari layout engine. In Phase 3, production smoke was performed in Chrome 150 via DevTools:
light/dark/CVD screenshots, RTL transform, reduced-motion, forced-colors, overlay z-order, reflow at
200%/400%/ultrawide and real Dialog/Drawer/Command Palette ARIA/focus/scroll assertions. State
extended matrix:

| Matrix                   | Scenarios                                                        | Status                                                                          |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Chromium light/dark      | Nested overlays, z-order, focus, AppShell, CodeBlock, Playground | PASS, 24 captures; 0 browser/network errors                                     |
| Firefox light/dark       | Grid, logical properties, focus/scroll behavior                  | NOT_RUN, engine is not installed in automation                                  |
| WebKit/Safari light/dark | Hydration, storage/media fallbacks, sticky/layout, touch copy    | NOT_RUN, engine is not configured in automation                                 |
| Edge/Windows HC          | Forced colors focus, checkbox/radio/switch, disabled states      | PARTIAL, Chromium emulation PASS; native Windows/Edge NOT_RUN                   |
| RTL                      | MenuBar arrows, Switch, NavMenu, ToC, Select and scrollers       | PASS for unit contracts and Chromium Switch/runtime smoke                       |
| Zoom 200%/400%           | Overlay fit, text wrapping, horizontal overflow, touch targets   | PASS in Chromium effective viewport; native multi-engine repeat remains GA gate |

Chromium runtime smoke confirmed stacking `overlay/drawer/dropdown/popover/tooltip =
1000/1000/1100/1125/1150`, mirrored Switch transform, transition duration `0.01ms`, stopped icon
spin, `scroll-behavior: auto`, forced-colors outline without box-shadow, modal focus/scroll lock and Command
Palette combobox/listbox linkage.

Reflow probe checked Core, Layouts, CodeBlock and Playground with effective CSS viewports 720×550@2x,
360×275@4x and 1920×1080@1x. There is no document-level horizontal scroll; at 400%, Dialog occupies
328×226 px, Drawer 360×275 px, Command Palette 328×215 px, and the coarse-pointer CodeBlock copy action
is 44×44 px and always visible.

Nuxt-specific end-to-end fixture also remains desirable. Current SSR tests use Vue server
renderer and directly check the most dangerous hydration boundaries, but do not cover Nuxt plugins,
streaming or application-level theme bootstrap.

## 14. Release readiness

### Changes that may affect appearance

The palette and semantic color mapping are not changed, but the zero visual diff for Phase 3 is not declared:
several patches intentionally change only defective or preference-specific states.

| Change                                 | When visible                                                              | Expected effect                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Overlay z-index `1100/1125/1150`       | Dropdown/Popover/Tooltip next to modal/drawer                             | Floating descendant is no longer hidden under the modal layer.                             |
| Motion literals → fast/standard tokens | Hover/focus/state transitions Button, IconButton, Input, Select, Textarea | The duration becomes consistent (current fast token 220 ms instead of local 120/180 ms).   |
| Reduced-motion contract                | Only with `prefers-reduced-motion: reduce`                                | Almost instant transitions, no icon spin, no smooth scroll.                                |
| Forced-colors contract                 | Only in forced-colors mode                                                | System focus/checked/disabled cues instead of lost custom colors/shadows.                  |
| RTL logical geometry                   | RTL only                                                                  | Correct mirroring of thumb, indentation, alignment and menu arrows.                        |
| Command Palette viewport cap           | Short viewport/200–400% zoom                                              | The content remains inside the available height and scrolls in the inner body.             |
| Typography no-wrap showcase            | Only narrow effective viewport                                            | Demo locally scrolls horizontally without creating a page-level scroll.                    |
| AppShell grid correction               | Granular AppShell CSS and affected responsive layouts                     | The Browser applies intended columns/areas instead of discarding invalid shorthand.        |
| AppShell subheader size parity         | Overflowing subheader content                                             | Full and component CSS use the same exact block-size contract.                             |
| CodeBlock standalone fallbacks         | CodeBlock without Core CSS                                                | Predictable light/dark materials, typography and spacing from existing defaults.           |
| CodeBlock touch copy                   | Coarse/touch pointer                                                      | Copy action is always visible and has a 44 px target.                                      |
| Theme browser state after mount        | SSR page if stored/system theme is different from server default          | Hydration stays clean; Without app bootstrap a short first-paint theme switch is possible. |

Other changes relate to ARIA, focus/keyboard ownership, package metadata, TypeScript declarations,
security validation, tree shaking and tests and should not change the normal LTR light/dark rendering.

### Compatibility

- Color palette values: **not changed**.
- Public color/token names: **not changed or removed**.
- Legacy tokens: **not deleted**.
- Component props/events/slots: existing names **not renamed**; new fields/props additive.
- Runtime/static/full/component-entry theme contract: final parity gate re-confirmed.
- Objective exceptions: Vue peer minimum increased to 3.5; Icons CommonJS CSS became explicit;
  controlled AppShell no longer emits initial state. Reasons and migration notes are given in section 9.

### Final conclusion

After implementing the fixes, VueForge has a mature public UI library architecture: package
boundaries are checked by packed consumers, SSR/hydration are first-class contracts, granular CSS and
tree shaking are protected by automation, and accessibility semantics are coordinated across components.

The correct wording after the final run is **engineering release candidate ready**: all
configured root/package/CSS/SSR/publication gates and Chromium smoke passed. Claiming fully certified
GA status comparable to the largest Design Systems additionally requires a permanent Firefox/WebKit/
Windows matrix, 200%/400% zoom testing, a manual AT pass, and an official docs-site build. This
distinguishes proven engineering readiness from platform certification that is not yet complete.

### Rating on a 10-point scale

Estimates refer to the final Phase 3 state after automated release gates and Chromium smoke.

| Direction         | Evaluation | Rationale                                                                                                                                          |
| ----------------- | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture      |     8.9/10 | Good package/layer separation and strong boundary contracts; stack manager and separate async entry remain future improvements.                    |
| API               |     8.6/10 | Wide compatible typed API; exports/subpaths have been fixed, but unified polymorphism/i18n requires a separate design.                             |
| Accessibility     |     8.6/10 | Fixed overlay, ARIA, keyboard, preferences, RTL and Chromium 400% reflow defects; manual AT/multi-engine certification has not yet been completed. |
| Design System     |     9.1/10 | Mature token/color/CSS contracts after Phase 0–2, consistent motion/stacking layer without subjective redesign.                                    |
| DX                |     8.8/10 | Granular imports, precise declarations and packed consumer tests; docs-site and migration flow can be strengthened.                                |
| Performance       |     9.0/10 | Initial graph and single-component imports have automatic budgets; A separate Playground async entry is still needed.                              |
| Documentation     |     8.3/10 | Confirmed API drifts have been fixed; there is no separate build/broken-link gate and consumer-facing migration note.                              |
| Maintainability   |     9.0/10 | Causes of regressions are turned into contracts, changes are local; Several full/component representations require constant parity protection.     |
| Testability       |     9.2/10 | Strong unit, SSR, packed consumer, CSS, and bundle gates; real-browser/AT automation remains a gap.                                                |
| Release Readiness |     8.9/10 | Root-wide gates, Chromium visual smoke and publication dry-run completed; multi-engine/AT/docs-site certification remains a separate GA gate.      |
