# Visual excellence initiative

## Work register

| Status  | Objective                                                         | Scope and evidence                                                                                             |
| ------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| DONE    | Identify the accepted reference and preserve the comparison input | RC.2 hosted verification and a separate copy of the starting worktree, including its pending showcase changes. |
| DONE    | Audit the inventory and define shared visual rules                | Reviewed 64 public entries, 62 manifests, CSS and token sources, and representative browser states.            |
| DONE    | Repair shared visual defects at their source                      | Shared CSS and theme roles, with packaged focus and selection verification across three engines.               |
| DONE    | Refine reference pages and compositions                           | Both production showcases, with comparison captures and four clean Core axe scans.                             |
| DONE    | Verify rendering, interactions and package boundaries             | Final package and SSR suites, paired component checks, and three production showcase browser sweeps.           |
| DONE    | Record independent critique and release disposition               | Reviewed before and after captures and documented release gates.                                               |
| BLOCKED | Approve the new release baseline                                  | Requires the pinned hosted renderer and manual native verification.                                            |

## Baseline and scope

The branch started at `857c0e396077a7703a6b0b28c7c731fdb7f7befb`. The latest accepted hosted
run belongs to `3b292a929732714adb6fe5f8c756206dc492cf65`. It passed all eight jobs, including
the strict stored visual comparison. See the [RC.2 verification record](codemonster-ui-2.0-rc.2.md).
The before comparison uses the actual starting worktree, which already contained a showcase
reorganization and build changes. The approved historical PNGs remain a separate reference.

The [package boundaries](../architecture/package-boundaries.md) place the visual system in
CSS and design tokens. Canonical HTML and behavior scenarios describe shared public behavior.
Vue renders the component markup and Vanilla can enhance HTML in place. Native HTML, progressive
enhancement and optional font loading are part of the review criteria.

## Design specification

- Use semantic roles at the point of consumption. Preserve the neutral surfaces and use the
  accent for actions, focus and selection. Verify foreground and boundary colors against their
  actual adjacent surfaces in both themes. Pair feedback color with a label, icon, or state cue.
- Align mixed controls by size and baseline. Keep compact geometry for dense toolbars, use the
  default size for forms, and let translated text wrap or grow. Reserve fully rounded shapes for
  meaningful pills and circular controls.
- Use heading, body, label and caption roles for predictable hierarchy. The bundled Inter faces
  cover Latin and Cyrillic. Treat the system fallback as a supported composition and allow for
  different glyph metrics. Use tabular numerals where values need to compare down a column.
- A shared surface, border and shadow hierarchy should read in both themes. Use elevation for
  an overlay boundary and keep focus visible when shadows are suppressed. Reserve motion for
  state changes and follow the system's reduced-motion preference.
- Prefer an information-first showcase. Keep navigation and content on a shared alignment grid,
  use the real component APIs in examples, and give long or wide content its own usable reflow
  or scroll behavior.

Design references include [Linear's visual hierarchy and alignment](https://linear.app/now/how-we-redesigned-the-linear-ui),
[Geist's color roles](https://vercel.com/geist/colors), [Radix Themes' color steps](https://www.radix-ui.com/themes/docs/theme/color),
[Stripe's distinction between layout and appearance](https://docs.stripe.com/payments/mobile/embedded),
and [Apple's typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography).
Use the [WCAG 2.2 criteria](https://www.w3.org/TR/WCAG22/) for enabled text contrast,
non-text state cues, focus visibility, target size and reflow.

## Token specification

The [consumer token guide](../tokens/getting-started.md#design-tokens) describes the public CSS
variables. The package serializes the same theme graph for both adapters. The neutral 260° ramp
sets the surfaces and the neutral text hierarchy. The 247° primary ramp gives actions, selection
and focus a shared accent. Status roles map to independent success, warning, danger, info and help
ramps. Component-local properties resolve shared roles into specific dimensions and states.

| Area                         | Rule and source                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors                       | Keep the existing [OKLCH primitives](../../packages/tokens/src/primitive-colors.ts). In the [semantic mappings](../../packages/tokens/src/semantic-colors.ts), place the interactive border between neutral 400 and 500 in each theme. Strong borders use neutral 500 in light mode and 400 in dark. Muted text sits between 500 and 600 in light and between 300 and 400 in dark. |
| Space and size               | The [spacing scale](../../packages/tokens/src/spacing-sizing.ts) starts at 0.25 rem and reaches 4 rem. Shared control minimums are 1.75, 2.25 and 2.5 rem. [Control padding and icon sizes](../../packages/tokens/src/control.ts) allow optical offsets.                                                                                                                           |
| Typography                   | The [type scale](../../packages/tokens/src/typography.ts) spans 0.75 to 1.25 rem, with body at 1 rem, label at 0.875 rem and caption at 0.8125 rem. Weights 400, 500, 600 and 700 establish hierarchy. Inter's [optional Latin and Cyrillic faces](../../packages/css/src/fonts.css) fall back to installed UI fonts.                                                              |
| Border, corner and elevation | Use the [1 px boundary, 2 px strong stroke, and radius and shadow roles](../../packages/tokens/src/borders.ts). Default control, surface and overlay radii are 0.625, 0.75 and 0.875 rem. The keyboard focus outline uses the 3 px control focus token.                                                                                                                            |
| Motion and stacking          | [Motion](../../packages/tokens/src/motion.ts) uses 220 ms fast, 320 ms normal and a standard ease, with reduced motion controlled by [preference CSS](../../packages/css/src/foundation/preferences.css). Native modal dialogs use the browser top layer. Inline overlays stack locally. Portaled Popover and Tooltip sit above the documented sticky layer.                       |

## Component inventory and verification boundaries

The public source inventory is 64 named `Cm*` components across `packages/vue/src/index.ts` (52) and `packages/layouts/src/index.ts` (12), described in `docs/components/index.md`. ConfirmDialog is a Dialog/Button composition and ThemeProvider defines scope and client/server theme behavior. They have recipes and targeted tests but no standalone fixture manifests. Historical `Vf*` exports include aliases and compatibility wrappers, so the public component count is not a count of distinct export names.

All 62 manifest-backed slugs appear below. Counts are canonical cases and executable behavior scenarios discovered under `contracts/<slug>/{cases,behavior}`. Their source coverage was reviewed against the public exports, `examples/shared/showcase-matrices.mts`, package CSS and existing fixture runners.

| Family and inventory                                                                                                                                                           | Cases / behaviors | Covered examples and visual limits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions and forms — Button, IconButton, Link, Field, Fieldset, Input, Textarea, Checkbox, Radio, Switch, Select, DatePicker, FormLayout, ThemeSwitch                           |           58 / 16 | Existing Button/IconButton showcase grids cover the nine visual variants, three sizes and disabled samples. Shared form variants cover three sizes; examples add required, invalid, disabled, readonly, enhanced, checked and mixed cases where supported. Canonical captures omit most size × state combinations (for example Input sm, Select lg, Radio lg). DatePicker’s nine canonical fixtures include value, clear, range, multiple, month, year, time and portal; opening and contrast require the browser harness. Forced colors exposed lost focus and choice-state defects. |
| Navigation — Accordion, Breadcrumbs, Tabs, Stepper, NavMenu, MenuBar, TableOfContents                                                                                          |           25 / 18 | Cases cover representative active, expanded, collapsed and disabled paths plus roving focus; ordinary appearance is shared. Canonical cases do not span every layout, long title, nested depth or Stepper content placement. Tabs’ selected underline survived the dark forced-colors probe.                                                                                                                                                                                                                                                                                          |
| Menus and overlays — Menu, Dropdown, Popover, Tooltip, Dialog, Drawer, CommandPalette                                                                                          |           32 / 25 | Cases and browser interactions exercise the open and closed, escape, containment, focus return, menu activation and empty/filtered paths. Shared motion and surface selectors are reused. Drawer right/full and Tooltip start/end/long do not have standalone canonical captures; showcase controls supplement most of these. ConfirmDialog adds separate composition/runtime and modal-focus tests.                                                                                                                                                                                  |
| Display and feedback — Icon, Alert, Avatar, Badge, Tag, Divider, Skeleton, SkeletonGate, ProgressBar, ProgressSpinner                                                          |            24 / 0 | Static states include image/initials, semantic tones, two divider orientations, loading/ready, determinate/indeterminate and animation checks. Showcase adds tone and icon variant controls. Canonical screenshots sample rather than exhaust semantic tones, Icon family/weight combinations and ProgressSpinner size/tone combinations.                                                                                                                                                                                                                                             |
| Data — Table, DataTable, ColumnChooser                                                                                                                                         |            10 / 8 | Cases cover basic/compact presentation, empty, raw/interactive rows, pins, resizers and expansion; scenarios exercise sorting, selection, paging and column visibility. Showcase variants add the loading/error/density controls. Combinations such as long labels, narrow pinned responsive tables, RTL, and reorder/resize under real touch require additional evidence.                                                                                                                                                                                                            |
| Layout and surfaces — Container, Grid, Inline, Section, Stack, Card, GroupBox, Panel, PageHeader                                                                               |            18 / 1 | Static examples cover representative geometry, semantic element variants and surfaces. GroupBox has collapse behavior. The fixtures omit many visual combinations of slot content, heading level, label length and intrinsic wrapping.                                                                                                                                                                                                                                                                                                                                                |
| Shells, pages and areas — AdminLayout, AdminShell, AppShell, AuthLayout, DocumentLayout, ErrorLayout, SetupLayout, HeaderArea, SidebarArea, ContentArea, AsideArea, FooterArea |            14 / 4 | Fixtures sample collapsed/open sidebar, sticky shell, document offsets and setup keyboard advancement. The grouped styles in `layout-areas.css` and `page-layouts.css` implement seven region/page manifests. The designed showcase compositions exercise real library layout APIs, while the contract cases sample shell widths and region combinations.                                                                                                                                                                                                                             |

The former stored PNG gate used `contracts/cross-platform-visual-baselines.json` to select 12 case IDs, 2 themes and 2 viewports (48 images for each adapter). The broader 362-capture comparison covers 181 canonical cases at both themes, one default viewport, and compares Vue-mounted to enhanced Vanilla, with separate behavior after input. Existing `packages/vue/__tests__/*-ssr.test.mjs` compare Vue SSR with canonical HTML via the significant-DOM comparator. Hydration and native fallback have targeted tests, for example `packages/vue/src/components/tabs/CmTabs.hydration.test.ts`, `packages/runtime/__tests__/hydrated-elements.test.mjs`, and `packages/runtime/__tests__/native-modal.test.mjs`. These verify distinct lifecycle states and do not make every paired visual case a hydrated SSR test.

Canonical content is predominantly English. The typography specimen samples Latin and Cyrillic.
Localizing entire examples would exercise additional wrapping, number formatting and truncation
combinations. The optional Inter CSS contains Latin, Latin Extended, Cyrillic and Cyrillic
Extended subsets.

## Visual audit and component refinements

| Priority | Impact and architectural cause                                                                                                                                                                                                        | Candidate change                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | In forced colors, the browser suppresses shadows, removing the visible keyboard cue from multiple controls that set `outline: none`. Hidden native choice fields were especially affected because they delegate drawing to a sibling. | Keep a transparent outline beside the normal focus shadow in shared form, action and navigation CSS. Use a system-painted outline in forced colors.                                                     |
| P1       | Radio used the same paint for the checked dot and its track on hover and press, hiding the state. The checked marker also blended into the forced-colors background.                                                                  | Use the semantic primary boundary color for the mark and a neutral hover or press surface. Use a system color for the forced-colors mark. See [Radio CSS](../../packages/css/src/components/radio.css). |
| P1       | Forced colors flattened the ThemeSwitch selection and the Select option set when focus moved away. DatePicker's distinct border for today could merge with ordinary dates.                                                            | Mark selection and current date explicitly in forced colors in their shared component CSS.                                                                                                              |
| P2       | Default interactive borders were weak where the component was laid over an elevated or tinted surface. Enabled muted text fell below 4.5:1 on some of the same surfaces.                                                              | Adjust semantic mappings across both themes. Use existing OKLCH stops and keep the stronger border at a distinct emphasis.                                                                              |
| P2       | The showcase matrix begins with a 20 px H1 and 24 px section headings. Deep demos were difficult to reach directly from the top.                                                                                                      | Build a stronger title hierarchy and a native section index from the showcase's shared structure.                                                                                                       |
| P2       | The screenshot comparator silently ignored a manifest-listed file missing from disk.                                                                                                                                                  | Make missing files fail the run, including in report-only mode, and record the owning capture. See the [comparator regression](../../scripts/visual/compare-showcase.test.mjs).                         |

Chromium reported the following sRGB ratios from the resolved token pairs.

| Role and adjacent surface                        | Light before → after | Dark before → after |
| ------------------------------------------------ | -------------------: | ------------------: |
| Interactive border, subtle light / elevated dark |          2.85 → 3.63 |         2.51 → 3.14 |
| Muted text, subtle light / elevated dark         |          4.29 → 4.90 |         3.78 → 4.74 |

The minimum interactive border ratio over the six sampled base surfaces was 3.04 in light mode
and 3.14 in dark. Active text and state indicators use 4.5:1 and 3:1 respectively for the
relevant comparisons. Native inactive controls use the [WCAG inactive exception](https://www.w3.org/TR/WCAG22/#non-text-contrast).

## Showcase refinements

- The [Vue matrix](../../examples/ui-showcase/src/App.vue) and [Vanilla generator](../../scripts/build/build-vanilla-showcase.mjs)
  use the same section order and native hash destinations. The [shared shell](../../examples/shared/showcase-shell.css)
  applies the responsive title hierarchy and spacing. At 360 px, the heading grows from 20 to
  28 px. At 1,440 px, it grows to 34 px. The section headings stay at 24 px. Nine links make
  the matrix navigable by keyboard immediately below the title.
- The [typography specimen](../../examples/shared/showcase-typography.mts) includes Russian text
  with its language declared. Rendered glyph inspection confirms use of the bundled Cyrillic Inter face.
- The warehouse example at `/layouts/#demo-admin-shell` uses the public DataTable caption and
  end-aligns quantities in the [shared layout preview](../../examples/ui-showcase/src/LayoutExample.vue). Its narrow preview
  allows keyboard scrolling. The browser suite checks paging, changing page size, and resuming
  the composition at the narrow width.
- Matrix landmarks have distinct names and overflowing table examples can receive keyboard focus.
  The shared examples compose native and library components, including tables, forms, navigation,
  surfaces and overlays. The existing route set carries the new presentation.
- The former Vanilla demo frame (`examples/vanilla/showcase-demo.js`) deferred iframe size changes to
  the next animation frame and skips duplicate values. The button and DatePicker reference pages
  reproduced an intermittent WebKit resize observer warning before this change.

## Before and after

The local evidence uses Chrome for Testing `151.0.7922.138` on macOS 27.2.1 (`26B131`) for the
stored component comparison. The captured matrix covers 12 fixtures in two themes at
390 and 1,280 px in each adapter. Strict comparison uses the repository's existing threshold 4.

| Comparison                                      | Result                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same renderer, starting worktree to candidate   | 12 of 48 images changed per adapter at threshold 0. The changed regions are the outlines of Input, Select and DatePicker, at both widths and in both themes. Dimensions are identical; 644 pixel positions changed per affected image.                                        |
| Candidate Vue to candidate Vanilla              | 48 of 48 matches at threshold 0, including all changed borders.                                                                                                                                                                                                               |
| Historical approved PNGs to the local candidate | 44 of 48 images differ per adapter. Of 8,014 flagged pixel positions per adapter, 520 reproduce the [known renderer residual](stored-visual-renderer.md) and 7,494 fall within the reviewed component border changes. Zero positions fall outside those two measured regions. |

The independent reviewer compared desktop and mobile, enforced visible focus in forced colors,
and inspected actual screenshot pixels. Early forced-colors iterations mapped an outline to the
canvas color and mapped selected text to its browser-painted backplate. The final review checked
separate visible focus and selection on Checkbox, Switch and Radio, readable selected labels on
Select and ThemeSwitch, and an underline distinguishing today's DatePicker cell from another
focused date. The type review checked the loaded font and hash-navigation focus on the live matrix.

See `artifacts/visual-excellence` for raw images and reports. `before/component` and
`after/component` contain the fixture matrices. `showcase/{before,after}` contains the Core and
warehouse captures on mobile dark and desktop light. The warehouse element crops gained one
raster row at both widths, with the same 36 rem iframe height in CSS. The CSS preview widths
are 320 and 1,024 px in both builds. `diff/renderer-attribution.json` records the per-image
attribution and `diff/same-renderer` includes pixel overlays. Baseline PNG approval remains on
the release register below.

## Engineering and accessibility verification

| Check                                       | Candidate result                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical behavior and parity               | Pinned Chromium passed 144 runs across 72 existing behavior scenarios with matching motion signatures. All 362 enhanced Vanilla and mounted Vue image pairs matched across the full suite and a targeted retry for transient fixture navigation. In the independent Chromium forced-colors review, effective style and geometry measurements matched across 20 fixture and theme pairs. |
| Initial and enhanced rendering              | `npm test` passed the package tests and contract checks, including Vue SSR significant-DOM assertions, native HTML fallback and targeted hydration. A live JavaScript-disabled Vanilla matrix reached the Forms section by keyboard. The fixture capture reflects the enhanced or mounted outputs.                                                                                      |
| Published CSS, two themes and three engines | [The packaged browser regression](../../scripts/visual/check-form-visual-states.mjs) passed all 24 adapter, theme and mode combinations. It checks 14 focus targets, visible focus contrast, the checked Radio dot through hover and press, and the selected/current cues. The preserved before worktree failed all eight Chromium combinations.                                        |
| Radio non-text contrast                     | Rest, hover and press measure 4.62, 4.14 and 3.47 in light and 4.91, 4.39 and 3.80 in dark. The ratios match between adapters.                                                                                                                                                                                                                                                          |
| Accessible markup and references            | The canonical structural and axe check passed all 181 cases. Four full Core matrix axe scans covering both adapters at 360 px dark and 1,440 px light found zero violations. Chromium opened a named preview on each of the 124 manifest-backed component routes.                                                                                                                       |
| Distribution                                | Workspace type checks, documentation, package contracts, visual fixture validation, tree shaking and all seven package size budgets passed locally.                                                                                                                                                                                                                                     |

The final production showcase passed 300 route, width and theme combinations, 24 top-level axe
checks and 12 open DatePicker contrast scans in Chromium 149, Firefox 148 and WebKit 26.4. The
suite included narrow-width reflow, 200% text, keyboard navigation and the warehouse composition.
The final Chromium run served the production files through a static server with directory listings
disabled. Earlier runs through the preview server had intermittent initialization or tab-click
timeouts. The targeted Chromium 147 App Shell recheck passed ten direct trials and three
full route-prefix trials. Both sets of logs are in the evidence archive.

Run the packaged regression after `npm run build` with `npm run visual:cross-platform:serve`
active. Set `SHOWCASE_PLAYWRIGHT` to an installed Playwright module when needed, then run
`node --test scripts/visual/check-form-visual-states.mjs` with `SHOWCASE_BROWSER` set to `chromium`,
`firefox` or `webkit`. Browser coverage used the aggregate package stylesheet, public tokens and
optional font entry. Selective CSS consumers use the documented `foundation.css` entry.

## Remaining issues and release recommendation

**Hold release approval.** The product and showcase changes can proceed to review. Approving
updated historical reference images requires a capture and review on the pinned hosted renderer.
This review preserved the stored PNGs, comparison thresholds, package versions and release baseline.

- Native VoiceOver and NVDA speech, Windows High Contrast and real iOS/Android touch remain open.
  The three engine runs use headless browsers and emulated preferences.
- Compact clear and password actions retain their existing target-size limitations. The sample
  matrices and automated checks provide partial WCAG 2.2 evidence. Full variant-by-variant,
  locale, native-device and assistive-technology coverage is still open.
- The light-theme muted foreground measures 4.11:1 on the transient neutral active surface.
  Reserve that foreground for the documented neutral canvas and resting surfaces. Custom themes
  need to measure foregrounds against the surfaces they supply.
- Consumer migration is unnecessary. Theme overrides may need to be rechecked for the new
  semantic defaults if they depend on the old border or muted text values.
