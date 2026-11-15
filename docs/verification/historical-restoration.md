# Historical restoration queue

The acceptance reference is `d987911604a770aec4fff5311b2e43c46ae40afe`. Work started on clean
`main` at `49574d25057270f158cb43f567a15e2a7ebe813d`, one local commit ahead of the remote tracking
branch. Preserve that commit and all existing work. Do not publish or push as part of this queue.

The current release line distributes tokens, CSS, utilities, icon data, runtime, Vue components,
and Vue layouts. Keep those package identities. CSS and tokens are shared; the Vue adapter owns
its rendering and reactivity; the Vanilla runtime enhances canonical HTML. Either platform can
use pure rules from `ui-runtime/core`. Existing names and paths from VueForge must be traced to
the current API or to the original published package. Record any difference that still needs a
migration, including behavioral or visual differences. Do not claim parity from matching names.

| Status | Work and acceptance evidence |
| --- | --- |
| DONE | Repository preflight: clean tree, both commits present, npm workspaces and eight CI jobs inspected. |
| IN PROGRESS | [Vue core contract trace](historical-vue-core.md) inventories the 46 historical components. The current package and opt-in entry expose all 46 names. Remaining contracts need individual evidence, including DataTable labelled pagination and drag reorder, overlay variants, and package/plugin differences in the trace. |
| IN PROGRESS | [Layout and icon trace](historical-vue-ecosystem.md) records shell, icon and static layout restoration (`172297ec`, `f6781197`). The Vue theme provider and switch variants (`a235eb36`) passed 10 focused tests, including SSR and cross-tab storage. Check final package entry points and remaining composables against the reference. |
| DONE | Restored the Playground section through the historical published releases (`vueforge-playground@3.0.1`, runtime `2.1.0`, Vite plugin `1.0.0`). The private showcase builds against real package entry points. Chrome verified both script-sandboxed frames, the direct Vue preview, both Vite modules, source tabs, console output, theme and mobile width. |
| DONE | Added a [standalone Vanilla Playground](../recipes/playground.md) for editing and running HTML, CSS and JavaScript (`4a4473d1`). Chrome tested no-script fallback, keyboard Run and Reset, iframe origin separation, and the documented limits on resource requests and top navigation at 390 and 1280 px. |
| DONE | Restored the CodeBlock section with the published `vueforge-codeblock@4.0.1` package and all 20 historical examples. Vue showcase lint, typecheck, and production build passed. Chrome verified the direct route at 390 px, highlighting, 1,000 line numbers, copy, dark theme, and loading replay. |
| IN PROGRESS | [Vanilla contract trace](historical-vanilla.md) records CSS and controller coverage. Standalone packed CSS-only and CSS+JS npm consumers passed without resolving any framework. Check missing contracts and repeat final consumer verification. |
| DONE | Added the Vanilla ColumnChooser enhancement and its contract trace. Runtime checks passed 209 tests. Chromium verified default light and dark visual parity with Vue and both chooser behavior scenarios. |
| DONE | Restored `VfDataTableColumnChooser` with its gear trigger, authored trigger scope, body portal, and ordered model updates (`679b43e5`). All 49 built package/canonical/behavior tests passed. Pinned Chrome passed six behavior runs and exact light/dark fixtures in both adapters; production Vue passed 390 and 1280 px keyboard, focus and table visibility checks. |
| DONE | Fixed Vanilla runtime observation of transient removals, cross-root moves and attribute changes. Runtime lint, typecheck, build and 206 tests passed on Node 24. |
| DONE | Fixed mixed-page ownership during SSR hydration in Vue and standalone Vanilla (`f647d6a6`), scoped nested HTML shell controls (`c8db7e48`), and returned focus when an open Vue modal unmounts (`4693aab3`). Pinned Chrome exercised hydration handoff, nested Escape and modal teardown. |
| DONE | Added a [standalone Vanilla CodeBlock recipe](../recipes/code-block.md) with semantic no-script output and optional copy feedback (`d26e3cb0`). Three enhancement tests and the Vanilla build passed. The Chrome check covered light/dark, 390/1280 px, keyboard scrolling and clipboard responses stubbed at the browser API boundary. |
| IN PROGRESS | Vanilla table of contents (`7f5c3bbe`), GroupBox (`f6781197`), native Input clear/reset (`217155af`), and disabled selection form submission (`27ccb81b`) passed targeted interaction and form checks. Add remaining portable contracts. |
| IN PROGRESS | Build the exact historical reference in isolation, compare both themes and viewports against the current showcases, and investigate visual differences. |
| DONE | The shared showcase shell and native composition demos built and passed the Chrome interaction check. It exercised mobile navigation, keyboard theme toggling and persistence in both adapters, and Vue confirmation focus restoration, GroupBox and SkeletonGate. |
| DONE | Restored DatePicker keyboard, locale, multiple/range selection, native reset, month/year precision, and timezone-free minute selection in both adapters (`5b3f5403`, `454f9d0b`, `b86bd276`, `9fa2361a`, `e53dc22f`). Added calendar portals and placement (`6fd91b5f`). Chrome exercised selection, pagination, focus, clock bounds and value serialization. |
| DONE | Exposed `VfDatePicker` with the historical locale, Monday-first calendar and body portal defaults (`62df67a1`). Focused Vue, native-picker and built SSR/advanced input tests passed. The trace records differences in post-selection display, native time inputs and scoped Field IDs. |
| DONE | Restored top/bottom Drawer, native open/close synchronization, ProgressBar stripes and height, and Field floating labels (`f6bfddf7`, `55a5f7c2`, `0916b9cc`, `3c3057c9`). Chrome exercised both adapters, including backdrop modality, Escape, native dialog form close, reduced motion and label focus. |
| DONE | Restored NavMenu and MenuBar pills plus MenuBar roving focus (`823edcaa`). Their paired light/dark browser fixture screenshots matched exactly; both adapters passed the expanded keyboard and selection scenarios. |
| DONE | Restored Dropdown pills and scoped actions (`2a104970`), IconButton tones and name-based icons (`4d3850a1`), historical Input and Select (`79bd0800`, `4334b223`), and authored Tooltip triggers, delays and portals (`f26a5679`). Chrome checked canonical contracts, Select portal geometry, resize, and native dialog focus, and Tooltip focus and Escape in both adapters. |
| DONE | Anchored Dropdown, Select and DatePicker to viewport collision bounds while preserving their inline markup. Vue Dropdown also supports a portal. Chrome verified matched popup bounds at the lower-right edge in both adapters, native modal Escape, and exact light/dark Dropdown fixtures. |
| DONE | Restored CommandPalette host-ranked results, query submission, scoped content and historical result-object selection (`7cc28fec`). Pinned Chrome passed eight scenario runs across both adapters; a production mobile check exercised literal match highlighting, selecting a result with the keyboard, and restoring opener focus. Authored palette Teleport destination remains outside this implementation. |
| DONE | The icons catalogue is a neutral metadata entry (`be8ee84f`) and both showcases use it (`c4928bb1`). A fresh Vue consumer and the gallery browser check verified its metadata, all 116 icons, keyword search and unique SVG definitions. Loading Core does not fetch the icon catalogue. |
| DONE | Vanilla Layouts and both Icons galleries restored historical top-of-page geometry and order (`25825971`, `446f94f5`). See [layout and icon measurements](historical-vue-ecosystem.md) for viewport comparisons and browser interaction results. |
| DONE | Restored Colors page rhythm in the shared guide. Production Chrome matched hero, text, first palette and swatch geometry to `d9879116`; both adapters passed contrast calculation and code copy. |
| DONE | Restored historical named Alert and Avatar icons, default Alert tone and role, warning alias and icon visibility (`dde06d37`). The opt-in entry passed 11 pinned-browser assertions and the main consumer import guards. |
| DONE | Restored the lead Core theme and typography examples (`fa166db5`). Chrome observed all nine variants, Space activation, accessible state and persistence, and matched section geometry at both widths. |
| DONE | `VfThemeProvider` again reads the historical preference and publishes its resolved attribute (`7d9f093e`). In a built-package Chrome run, stored dark survived hydration, system mode followed media changes, and a modern provider used its own cookie. |
| DONE | Restored DataTable column resize (`ec5958dc`). Keyboard, pointer and autosize produced the same widths in both adapters, kept the table width fixed, and exposed the width on the accessible separator. Raw row keys, multi-sort, pinning and drag ordering remain separate. |
| DONE | Restored historical Badge, Tag and ProgressSpinner options (`9ba8ada4`), routed NavMenu bindings (`d232e084`), and Stepper bindings and placement (`8ff4cecf`). Targeted packaged and browser checks passed for each slice. |
| DONE | Restored Popover portal, placement, focus and close policies (`f784b486`), and authored Vue triggers in the historical Dropdown and Popover entry points. Pinned Chrome passed eight Popover behavior runs and eight paired fixture comparisons. The built example verified the body portal and focus restoration around one authored button. |
| DONE | Restored Dialog and Drawer initial state, naming and dismissal independently. Drawer adds fixed physical sides in RTL and LTR plus offset and padding. Both adapters passed all four native geometry/dismissal runs, six pinned behavior runs, and eight exact paired screenshots. |
| DONE | Restored Tabs custom IDs and scoped content (`1cb29a1f`), NavMenu named icons and compact mode (`62c48b06`), and DataTable column pinning (`06d2ca4a`). Chrome checked panel focus, compact accessible names, and sticky geometry after scrolling and resize at 390 px. |
| DONE | Vue DataTable accepts host records and stable string/path or numeric keys (`a9a9df93`); native events retain the current string ID contract. Built TypeScript consumers verified typed row scopes, and Chrome verified selection survives client sorting. `VfTable` restores `compact` with SSR-equivalent native markup (`d82fa231`). |
| DONE | Historical Switch, Checkbox and Radio expose the original model event payloads and slots (`08061eaf`, `28a555a9`). Chrome verified keyboard and native form behavior, checked and mixed accessibility state, and a Checkbox runtime-to-Vue hydration handoff. |
| DONE | Restored the historical single Accordion's model, scoped trigger/content, height and opacity motion, and focus return. Chrome measured the same 36 px trigger and 49 px open panel as the isolated reference at both 390 and 1280 px. Source and packaged SSR tests passed. |
| DONE | Restored labelled MenuBar groups and route leaves and the historical original-item event. Pinned Chrome passed six keyboard runs and six exact light/dark comparisons. The built Vue demo reached the real Layouts guide with Enter at both widths. The native import measures 5.38 KiB gzip without the named icon catalogue. |
| DONE | Restored historical DataTable typed keys and controlled selection, original cell and expansion scopes, and ordered sort models. Chrome verified the published Vue example at both widths: priority, tie order, one primary ARIA sort and reset to page one. The direct compatibility import measures 12.56 KiB gzip and carries no Vanilla controllers. |
| DONE | Vanilla DataTable expands authored detail rows (`0924c05a`), scopes events to the nearest table, and leaves sorting, selection and paging independent. Chrome exercised keyboard expansion and focus in both adapters. |
| DONE | Native modals now prevent background scrolling (`f0591f37`). Pinned Chrome verified classic and overlay scrollbars, internal scrolling, nested Escape and original page position in Vue, Vanilla, and a mixed pair. |
| DONE | Aligned Vue Layouts with the shared guide (`f47727a5`): changed pixels against the pinned historical views fell from 11.96–18.05% to 1.09–3.20%. Controls and responsive previews passed at both widths and in both themes. |
| DONE | Restored the Vue showcase's narrow navigation controls without shifting content when the system draws scrollbars. Shortened the shared Colors introduction to restore its mobile text rhythm. Pinned Chrome passed overflow, active-route and keyboard checks at 390 and 1280 px. |
| IN PROGRESS | Run package checks, lint, type checks, tests, browser behavior and accessibility checks, production builds, and fresh packed consumers. See the exact snapshots below. |
| IN PROGRESS | The independent review verified dependency direction and reproduced native close and form reset integration defects. Those fixes were verified separately. Review the final committed candidate and reconcile remaining historical contract and visual gaps. |
| TODO | Finish the acceptance report and verify that all assignment edits are committed and the tree is clean. |

## Resume point

Use the repository's Node 24 toolchain. `d9879116` and `fd793696` have the same complete Git tree
(`474626a33d7479a199ba1d5b8028af29a8c98064`); keep the existing fixture screenshots and their real
capture provenance. The exact `d9879116` archive passed offline dependency installation and
both package and showcase builds. The starting revision passed current package, Vue showcase and
Vanilla showcase builds. Compare the actual showcases in the browser separately from the fixture
gate; matching reference trees does not establish parity with the current checkout.

The starting showcase comparison captured 48 top-of-page frames (historical Vue, current Vue,
Vanilla; Core, Colors, Layouts and Icons; light and dark; 390 and 1280 px). Chrome reported no
uncaught JavaScript exceptions or horizontal page overflow. Against the historical frames at a
channel threshold of 4, all 16 Vue frames differed (1.2–24.6% of pixels), as did all 16 Vanilla
frames (32.4–69.7%). Review section geometry, mobile header placement, and Vanilla presentation;
these figures do not qualify as visual acceptance.

The revised capture used the same 16 frames per platform and the same threshold. Vue's mean
changed-pixel rate fell from 12.77% to 11.71% and Vanilla's from 46.75% to 42.15%. All frames still
differed. Vue Colors had a larger mean difference (9.78% to 11.50%) and remains a priority for
visual review. The revised comparison reported no uncaught JavaScript errors.
Local screenshots and reports are in `/private/tmp/cmui-acceptance.Uyf8RO` under `initial` and
`refined`. The reference is an isolated archive at `/private/tmp/cmui-d9879116.h4bqCs`.

The `palettes` capture followed the shared Colors rewrite (`08865a87`). At the same threshold, the
mean changed-pixel rate across 16 frames was 12.52% for Vue and 31.63% for Vanilla. All frames
still differed from the historical capture. The current Colors pages matched each other in
mobile hero and palette geometry, group order and all 12 displayed contrast ratios. Code copying
worked on both pages. These checks do not establish exact historical visuals or general WCAG
conformance.

The built `colors-built` capture matched the historical geometry of the hero, typography, and
first palette at both sizes and in both themes. Changed-pixel ratios were 3.62–3.72% at 390 px
and 0.89–0.95% at 1280 px across both adapters, down from 22.84–22.95% and 6.42–6.51%.
The product name, mobile top bar and related copy remain visible differences. See
`/private/tmp/cmui-acceptance.Uyf8RO/{colors-before,colors-built}`.

The pinned browser with classic scrollbars exposed an 11 px height increase in Vue's narrow
navigation, and the longer Colors text wrapped to an extra line. The 48 captures before and
after those fixes used the same capture settings; neither run reported script errors or
horizontal page overflow. Across 16 comparisons per adapter at threshold 4, Vue's mean fell
from 13.20% to 1.91% (worst frame: 36.01% to 3.50%), and Vanilla's fell from 3.98% to 1.86%
(worst: 20.67% to 3.44%). All frames still have nonzero differences. Viewport evidence:
`/private/tmp/cmui-browser-checkpoint.7GfdFS/showcase` and
`/private/tmp/cmui-browser-checkpoint.Acuv2H/showcase`. The Vue navigation keyboard log is
`/private/tmp/cmui-shell-mobile-smoke.log`.

## Verification checkpoints

- In pinned Chrome for Testing `151.0.7922.138`, all 96 fixture screenshots were byte-identical
  between the original `49574d25` and restored `4d3850a1` archives. Both local captures still
  fail the stored-baseline check: 44 of 48 changed per adapter at threshold 4, or
  520 of 559,172 pixels per adapter (0.093%). Independent text-mask recapture placed every
  above-threshold difference inside glyph paint, with unchanged screenshot dimensions. The
  hosted `macos-26` result and exact render-stack cause remain unverified; baseline images
  were left intact. Evidence: `/private/tmp/cmui-original-pinned.L9JYfo` and
  `/private/tmp/cmui-ci-visual.1xCWmT`. The 122 browser behavior runs at `4d3850a1` passed.
- `90815175`, fresh copy at `/private/tmp/cmui-verify.MEtWOJ`: all 20 executed checks passed,
  including lint, format, typecheck, cold tests, contracts, accessibility fixtures, tree
  shaking, both production showcases, and packed npm, pnpm and Yarn consumers. The release
  audit returned zero production findings and 20 low/moderate development findings. This
  snapshot precedes the latest showcase and overlay slices.
- `97ad5a07`, fresh copy at `/private/tmp/cmui-verify.qMbtuH`: all of the 18 offline checks
  except the cold suite passed, including 162 axe fixture cases. Cold testing found the Tooltip
  portal arrow's physical CSS rules and a test that sent a synthetic non-bubbling focus event.
  Both were corrected in `e3029077`. The isolated rerun with those two changes passed 810 tests;
  four pinned-browser LTR/RTL arrow captures matched exactly. Logs: `/private/tmp/cmui-tooltip-cold.rVDaue`.
- `8ff4cecf`, fresh copy at `/private/tmp/cmui-verify.k73jZi`: lint, format, typecheck, documented
  tests, 170 axe fixture cases, production builds, package installation with npm/pnpm/Yarn, and
  the release audit passed. Cold parity lacked two NavMenu target mappings; the exact harness
  fix is `f8990ccc`. The full runtime measured 72.64 KiB gzip after new overlay placement and
  column resizing; aggregate budget now reflects the measured expansion. Retain all individual
  import and pure-core limits.
- `62c48b06`, fresh copy at `/private/tmp/cmui-verify.b0ISig`: all 18 offline checks passed,
  including the cold suite and both production builds. An independent Dialog-focused cold retry
  also passed 839 tests; see `/private/tmp/cmui-dialog-policy.8m5f0G/cold-final.log`.
- `7d00e647`, fresh copy at `/private/tmp/cmui-verify.tU1ZdM`: 17 of 18 offline checks passed,
  including the cold tests, both builds, type checks, package and accessibility gates. Lint found
  two misaligned cells in the historical Vue trace; `28a555a9` fixed those cells and passed the
  trace lint. Run a fresh archive after the active component slices.
- `905ed0ec`, fresh copy at `/private/tmp/cmui-verify.W516XM`: all 20 checks passed, including
  cold tests, 176 canonical accessibility fixtures, production builds, packed npm/pnpm/Yarn
  consumers and the release audit (zero production findings; 20 low or moderate development).
  Pinned Chrome passed all 138 behavior runs and 352 paired theme comparisons without pixel or
  motion differences between Vue and Vanilla. Its 48 production viewport frames had no script
  errors or horizontal page overflow; the worst strict historical comparison was 3.46% in Vue
  and 3.43% in Vanilla. A clean fixture recapture produced all 96 images byte-for-byte identical
  to the starting revision's local capture; the stored-baseline comparison still counts 44 of
  48 changes per adapter. Evidence: `/private/tmp/cmui-browser-checkpoint.jmvofA` and
  `/private/tmp/cmui-fixture-recapture.0urDel`.
- The pinned browser ran 132 behavior scenarios across both adapters at `8ff4cecf` without failures
  or motion mismatches. The separate 48-frame showcase run reported no JavaScript errors and no
  horizontal page overflow. Vue Layouts was the largest remaining viewport difference in this run
  and was corrected afterward. Evidence: `/private/tmp/cmui-browser-checkpoint.kiEdef` and
  `/private/tmp/cmui-browser-checkpoint.XZHnOm`.

- `a9083071`, fresh copy at `/private/tmp/cmui-verify.Kvb8Dd`: installation, builds, typecheck,
  contracts, accessibility fixtures, package budgets and tree shaking passed. Cold workspace
  verification exposed canonical DataTable, dependency order, and export inventory defects.
  Registry-backed npm, pnpm and Yarn tarball consumers passed after the intentionally offline
  install could not resolve metadata in their empty consumer caches. The release audit found zero
  production vulnerabilities and no high or critical development findings; 19 low/moderate
  development findings were reported. The initial failures and reruns are retained in the logs.
- `3936ebf5` plus the five exact cold gate changes later committed in `c7207dfd`: clean install and
  all cold workspace tests passed, including 189 built Vue tests. Log:
  `/tmp/cm-layout-cold.c1hsdL/cold-verification.log`.
- `3c3057c9`, fresh copy at `/private/tmp/cmui-verify.hJF9nl`: full lint, cold workspace tests,
  contracts, package checks and builds passed. The typecheck reported an index export from an
  in-progress MenuBar change; its type is present in `823edcaa`. Format check reported only
  `CmDataTable.vue`. Re-run from a coherent committed candidate after these corrections.

Finish and verify each coherent slice before committing it; then select the next unfinished row.
Record actual output and commands, including any check that cannot run, before advancing the
corresponding status.

Next actions: restore numbered DataTable navigation and its callback labels, finish the public
Vue composable slices, then run the package and pinned browser checkpoints on the exact assembled
commit. Keep tracing column reorder, old portal and scroller behavior, and the package migration
gaps until independent acceptance. The strict stored screenshot gate is still unverified on the
hosted renderer; local capture differences are documented above. Distinguish full showcase
viewports from the established 12-case fixture baseline and from the paired adapter fixtures.
