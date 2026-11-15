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
| IN PROGRESS | [Vue core contract trace](historical-vue-core.md) inventories the 46 historical components. Initial compositions and variants (`0fb58ad8`), Link routing (`72dc5ceb`), and DataTable slots, selection, expansion and loading (`0b8ecc8d`, `2fafc9cf`) passed targeted checks. Continue DatePicker and remaining API gaps from the trace. |
| IN PROGRESS | [Layout and icon trace](historical-vue-ecosystem.md) records shell, icon and static layout restoration (`172297ec`, `f6781197`). The Vue theme provider and switch variants (`a235eb36`) passed 10 focused tests, including SSR and cross-tab storage. Check final package entry points and remaining composables against the reference. |
| DONE | Restored the Playground section through the historical published releases (`vueforge-playground@3.0.1`, runtime `2.1.0`, Vite plugin `1.0.0`). The private showcase builds against real package entry points. Chrome verified both script-sandboxed frames, the direct Vue preview, both Vite modules, source tabs, console output, theme and mobile width. |
| DONE | Restored the CodeBlock section with the published `vueforge-codeblock@4.0.1` package and all 20 historical examples. Vue showcase lint, typecheck, and production build passed. Chrome verified the direct route at 390 px, highlighting, 1,000 line numbers, copy, dark theme, and loading replay. |
| IN PROGRESS | [Vanilla contract trace](historical-vanilla.md) records CSS and controller coverage. Standalone packed CSS-only and CSS+JS npm consumers passed without resolving any framework. Check missing contracts and repeat final consumer verification. |
| DONE | Added the Vanilla ColumnChooser enhancement and its contract trace. Runtime checks passed 209 tests. Chromium verified default light and dark visual parity with Vue and both chooser behavior scenarios. |
| DONE | Fixed Vanilla runtime observation of transient removals, cross-root moves and attribute changes. Runtime lint, typecheck, build and 206 tests passed on Node 24. |
| IN PROGRESS | Vanilla table of contents (`7f5c3bbe`), GroupBox (`f6781197`), native Input clear/reset (`217155af`), and disabled selection form submission (`27ccb81b`) passed targeted interaction and form checks. Add remaining portable contracts. |
| IN PROGRESS | Build the exact historical reference in isolation, compare both themes and viewports against the current showcases, and investigate visual differences. |
| DONE | The shared showcase shell and native composition demos built and passed the Chrome interaction check. It exercised mobile navigation, keyboard theme toggling and persistence in both adapters, and Vue confirmation focus restoration, GroupBox and SkeletonGate. |
| DONE | Restored DatePicker keyboard, locale, multiple/range selection, native reset, month/year precision, and timezone-free minute selection in both adapters (`5b3f5403`, `454f9d0b`, `b86bd276`, `9fa2361a`, `e53dc22f`). Added calendar portals and placement (`6fd91b5f`). Chrome exercised selection, pagination, focus, clock bounds and value serialization. |
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
| DONE | Restored DataTable column resize (`ec5958dc`). Keyboard, pointer and autosize produced the same widths in both adapters, kept the table width fixed, and exposed the width on the accessible separator. Raw row keys, multi-sort, pinning and drag ordering remain separate. |
| DONE | Restored historical Badge, Tag and ProgressSpinner options (`9ba8ada4`), routed NavMenu bindings (`d232e084`), and Stepper bindings and placement (`8ff4cecf`). Targeted packaged and browser checks passed for each slice. |
| DONE | Restored Popover portal, placement, focus and close policies (`f784b486`), and authored Vue triggers in the historical Dropdown and Popover entry points. Pinned Chrome passed eight Popover behavior runs and eight paired fixture comparisons. The built example verified the body portal and focus restoration around one authored button. |
| DONE | Restored Dialog and Drawer initial state, naming and dismissal independently. Drawer adds fixed physical sides in RTL and LTR plus offset and padding. Both adapters passed all four native geometry/dismissal runs, six pinned behavior runs, and eight exact paired screenshots. |
| DONE | Restored Tabs custom IDs and scoped content (`1cb29a1f`), NavMenu named icons and compact mode (`62c48b06`), and DataTable column pinning (`06d2ca4a`). Chrome checked panel focus, compact accessible names, and sticky geometry after scrolling and resize at 390 px. |
| DONE | Aligned Vue Layouts with the shared guide (`f47727a5`): changed pixels against the pinned historical views fell from 11.96–18.05% to 1.09–3.20%. Controls and responsive previews passed at both widths and in both themes. |
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

Next actions: run the exact integrated package and browser checkpoint, complete independent
acceptance, and continue the remaining contract gaps as indicated by the trace. Prioritize
verified behavior over adding aliases for unsupported semantics. Distinguish showcase viewport
captures from the established 12-case fixture baseline.
