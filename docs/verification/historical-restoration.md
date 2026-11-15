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
| DONE | [Vue core contract trace](historical-vue-core.md) reconciles all 46 historical component names across the root and opt-in entries. The [migration guide](../migrate-from-vueforge.md) maps the published packages and documents import, CSS and theme changes. |
| DONE | [Layout and icon trace](historical-vue-ecosystem.md) records shell, icon and static layout restoration (`172297ec`, `f6781197`), theme provider and responsive composables. |
| DONE | Restored the Playground section through the historical published releases (`vueforge-playground@3.0.1`, runtime `2.1.0`, Vite plugin `1.0.0`). The private showcase builds against real package entry points. Chrome verified both script-sandboxed frames, the direct Vue preview, both Vite modules, source tabs, console output, theme and mobile width. |
| DONE | Added a [standalone Vanilla Playground](../recipes/playground.md) for editing and running HTML, CSS and JavaScript (`4a4473d1`). Chrome tested no-script fallback, keyboard Run and Reset, iframe origin separation, and the documented limits on resource requests and top navigation at 390 and 1280 px. |
| DONE | Restored the CodeBlock section with the published `vueforge-codeblock@4.0.1` package and all 20 historical examples. Vue showcase lint, typecheck, and production build passed. Chrome verified the direct route at 390 px, highlighting, 1,000 line numbers, copy, dark theme, and loading replay. |
| DONE | [Vanilla contract trace](historical-vanilla.md) records canonical markup, CSS, controller coverage and framework-specific exceptions. Standalone packed CSS-only and CSS+JS consumers passed without resolving a rendering framework. |
| DONE | Added the Vanilla ColumnChooser enhancement and its contract trace. Runtime checks passed 209 tests. Chromium verified default light and dark visual parity with Vue and both chooser behavior scenarios. |
| DONE | Restored `VfDataTableColumnChooser` with its gear trigger, authored trigger scope, body portal, and ordered model updates (`679b43e5`). All 49 built package/canonical/behavior tests passed. Pinned Chrome passed six behavior runs and exact light/dark fixtures in both adapters; production Vue passed 390 and 1280 px keyboard, focus and table visibility checks. |
| DONE | Fixed Vanilla runtime observation of transient removals, cross-root moves and attribute changes. Runtime lint, typecheck, build and 206 tests passed on Node 24. |
| DONE | Fixed mixed-page ownership during SSR hydration in Vue and standalone Vanilla (`f647d6a6`), scoped nested HTML shell controls (`c8db7e48`), and returned focus when an open Vue modal unmounts (`4693aab3`). Pinned Chrome exercised hydration handoff, nested Escape and modal teardown. |
| DONE | Added a [standalone Vanilla CodeBlock recipe](../recipes/code-block.md) with semantic no-script output and optional copy feedback (`d26e3cb0`). Three enhancement tests and the Vanilla build passed. The Chrome check covered light/dark, 390/1280 px, keyboard scrolling and clipboard responses stubbed at the browser API boundary. |
| DONE | Vanilla table of contents (`7f5c3bbe`), GroupBox (`f6781197`), native Input clear/reset (`217155af`), and disabled selection form submission (`27ccb81b`) passed targeted interaction and form checks. |
| DONE | Built `d9879116` in isolation, compared both themes and viewports against the current showcases, and traced the visual differences. These full-view reports are separate from the strict stored fixture gate. |
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
| DONE | Stepper markers and progress now use the shared package CSS. Chrome matched the historical 34 px markers, 2 px rail, progress and placement in the Vue showcase at both widths. Both adapters passed six exact fixture comparisons, four behavior runs and reduced-motion keyboard checks in LTR and RTL. |
| DONE | Aligned Vue Layouts with the shared guide (`f47727a5`): changed pixels against the pinned historical views fell from 11.96–18.05% to 1.09–3.20%. Controls and responsive previews passed at both widths and in both themes. |
| DONE | Restored the Vue showcase's narrow navigation controls without shifting content when the system draws scrollbars. Shortened the shared Colors introduction to restore its mobile text rhythm. Pinned Chrome passed overflow, active-route and keyboard checks at 390 and 1280 px. |
| DONE | Historical DataTable supports numbered pages and localized summaries (`f9a1961c`) and pointer/keyboard column reordering (`6febe9c3`). Chrome verified retained focus, pinned boundaries and both viewport widths. |
| DONE | Restored the public historical composables, including floating placement, scroll locking, focus trapping and reactive breakpoints. The opt-in theme plugin (`1efe29de`) supplies app-scoped theme defaults; raw legacy theme presets migrate to shared CSS tokens. |
| DONE | Tabs overflow controls and the moving selection indicator share measurement and CSS between adapters (`44629f01`, `a1d9c685`). Chrome checked selection, focus, LTR, RTL and reduced motion. |
| DONE | Dropdown and Popover share viewport placement and arrow styling (`15edc15c`). Chrome passed 16 cases for flipped and unflipped geometry, trigger alignment, LTR/RTL and restoration of authored inline values. |
| DONE | A running Vanilla runtime can hand off an enhanced SSR Tabs instance before Vue compares attributes (`11285758`). Chrome reproduced two attribute warnings before the fix and found zero afterward. The mixed overlay handoff also passed. |
| DONE | Restored the historical DataTable action labels (`79985f24`), including row selection and expansion, the next sort action and resize. Chrome verified the packaged component's accessible names before and after hydration and keyboard operation at 390 and 1280 px. |
| DONE | The cross-platform DataTable fixture now exercises detail visibility and expansion notifications in both adapters (`0a86edee`). |
| DONE | Default authored Tabs now get the same moving indicator after Vanilla enhancement (`d549c92a`). Four pinned pointer and keyboard runs had equal motion, and ten reduced-motion theme comparisons were pixel-identical. |
| DONE | Compact MenuBar items wrap and open in-flow branches without clipping (`34649ac4`). Chrome exercised pointer, keyboard, no-runtime links, and unchanged wide cascade geometry. Both 390 px Core pages fit after the change. |
| DONE | The exact package candidate passed 20 checks, including 964 cold tests, 181 axe cases, both production builds, and packed npm, pnpm and Yarn consumers. |
| DONE | Independent acceptance reviewed the Vue upgrade, standalone HTML consumption and future adapter boundary. The findings, fixes and remaining differences are recorded below. |
| UNVERIFIED | The required stored visual gate has not run on hosted `macos-26` for this candidate. Complete local PNGs match the starting revision's local run. |

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
- `1aef7bfd`, fresh copy at `/private/tmp/cmui-verify.BSTJH2`: all 20 checks passed, including
  936 cold tests, both production showcases, accessibility for 178 authored cases, dependency
  audits, and fresh packed consumers with npm, pnpm and Yarn. A direct historical DataTable
  import was 12.56 KiB gzip. This checkpoint precedes the Stepper and later slices.
- `15edc15c`, fresh copy at `/private/tmp/cmui-verify.Xq9PWo`: 19 of 20 checks passed. The cold
  suite identified an obsolete assertion against decorative `pointer-events: none` on Tabs;
  the focused correction is `7e2c5d42`. Packed consumers and the release audit passed.
  Pinned Chrome recaptured all 96 stored fixtures byte-for-byte against the starting revision's
  local run. The whole-showcase check found that the Vue Core MenuBar pills demo overflowed at
  390 px in both themes. Browser behavior also found missing targets in both DataTable fixture
  runs and a difference in the standalone Tabs indicator motion. Evidence:
  `/private/tmp/cmui-browser-checkpoint.r6C9N6`.
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

## Acceptance at 0a93f598

**Status: PARTIAL.** The clean package and local paired browser gates passed. Historical package
and behavior differences are documented, and the hosted stored-fixture gate is unverified.

Product and browser snapshot: `34649ac4148a28efe5857e0698259894da1d3d63`. Independent review
checked upgrading Vue consumers, standalone server-rendered HTML consumers, and dependency
direction for future adapters. It reproduced and rechecked the Tabs hydration issue and
animation mismatch. It also reviewed overlay hydration, DataTable labels, and MenuBar sizing.
No consequential defect remains known in the reviewed scope.

The package snapshot is `77bc8a659b85295a8d55859ceae721ee4bff7b6d`. The only difference from
the browser snapshot is one test runner assertion for DataTable visibility. All 20 checks
passed, including 964 cold tests, 181 canonical accessibility cases and fresh packed npm,
pnpm and Yarn consumers. The release audit found zero production vulnerabilities; the 20
development findings were all low or moderate. The evidence is in `/private/tmp/cmui-verify.SAM6tG`.

Pinned Chrome for Testing `151.0.7922.138` passed 144 behavior runs with equal motion in both
adapters. All 362 Vue/Vanilla fixture and theme pairs had zero differing pixels and no motion
mismatch. The historical reference and the two independent production builds produced 48 whole
showcase frames with no script errors or horizontal overflow. At a threshold of four RGB levels,
the largest changed areas among these comparisons were 3.50% in Vue and 3.44% in Vanilla. The
evidence is in `/private/tmp/cmui-browser-checkpoint.UGFHA9`.

The first stored-fixture sweep timed out on one case. A fresh profile completed all 96 captures
at the same revision and all PNGs matched the starting revision's local capture byte for byte.
Both adapters still show 44 of 48 differences when compared against the stored images. The
starting run has the same residual, isolated to glyph paint. The stored images were not
changed. The strict hosted `macos-26` result remains **UNVERIFIED**. Complete local recapture:
`/private/tmp/cmui-fixture-recapture.WkOzXA`.

The [migration guide](../migrate-from-vueforge.md) and contract traces record the package and
behavior differences. The current release uses ESM and explicit shared styles. The historical
package import paths, automatic style loading, CommonJS and raw runtime theme presets require
migration or the old release. Overlay transitions, MenuBar hover and portals, and DataTable
column motion and resize guides differ. In Vanilla the server or application owns table rows,
including any multi-column ordering and dedicated column reorder UI. These are explicit limits
of the current adapter contracts.

The next gate is the `visual` job from [CI](../../.github/workflows/ci.yml) on an authorized
`macos-26` runner at the same revision, using the pinned Chrome and the existing stored images.
Record the renderer and the exact result before changing the hosted visual status. This gate
compares the 12 stored component cases; it is separate from both the whole showcase comparison
and the paired Vue/Vanilla visuals.

## Continuation from 0a93f598

**Status remains PARTIAL.** Local package, browser behavior and adapter parity checks passed.
The affected components and the stored fixture set were recaptured from the final product source.
The exact hosted gate remains unverified, and the compatibility differences below remain open.

- Vue and Layouts share ESM and CommonJS component instances on supported Node versions
  (`8cae4010`). The 63 historical deep entries (`dc88b534`) load shared foundation and
  component CSS in browser bundlers. Node keeps these imports CSS-free. Packed npm, pnpm,
  and Yarn consumers, Node 22 and 24 SSR, and the pinned browser consumer passed.
  [Migration guide](../migrate-from-vueforge.md)
- Historical Dialog and Drawer accept authored portals (`65e81268`). Drawer accepts a
  custom scroll region or explicit lock opt-out (`5cd4173b`). Chrome verified live portal
  moves, native top-layer state, Escape and form dismissal, wheel locking, and focus return.
  Historical CommandPalette restores the body default and authored destinations (`23b86438`).
  A live move preserves the active query, focus, and native modality.
  The shared anchored control lookup falls back inline for malformed or self-referential
  destinations (`d333261f`).
- Historical DatePicker displays and submits only the host-accepted model (`67accda2`). In
  both adapters, the DataTable guide spans the table body during resize (`ca385dde`). Pointer
  checks confirmed the guide in LTR and RTL and verified that the active marker clears on release.
- The shared document foundation follows system and explicit light or dark preferences for
  native controls (`27b60bfe`). Pinned Chrome inspected all six historical and starting Vue
  showcase routes at 390 and 1280 px. The CodeBlock replay now keeps all 20 examples and
  preserves the long sample's scroll position (`05eb5804`, `f1d36874`). At both widths the
  heading uses the historical 23 px size and the first placeholder matches its 521 px height.
  The route keeps its page-level heading and uses the shared compact replay control.
- The renderer audit reproduced all 520 changed glyph pixels with exact `d9879116` on this
  Mac and matched its 48 font-normalized PNGs byte for byte to each current adapter. The
  capture lineage and older passing hosted job exclude a restoration regression and stale
  fixture dimensions for the verified matrix. The precise text rasterization difference is
  unresolved. [Stored visual renderer evidence](stored-visual-renderer.md)

The full local browser matrix at `5cd4173b` passed 144 behavior runs and 362 adapter fixture
pairs with no pixel or motion differences. It had zero script errors or overflow in 48 whole
showcase frames. Compared with the historical showcase at the four-level RGB threshold, the
largest changed areas were 3.50% in Vue and 3.44% in Vanilla. The same run captured all 96
stored fixtures and matched the starting revision's local output byte for byte. The complete
package gate also passed on that revision. Package and browser evidence lives at
`/private/tmp/cmui-verify.ouEZHK` and `/private/tmp/cmui-browser-checkpoint.cfsizN`.

The final product checkpoint is `23b86438378abd8394c7d40ed2b4bb9ae0cb7fd4`. All 20 clean package
checks passed, including 973 cold tests, 181 accessibility cases, both production builds, and
fresh npm, pnpm, and Yarn tarball installs. The production release audit found no vulnerabilities.
The historical namespace meets the unchanged 82,944-byte gzip limit. The exact package archive
is `/private/tmp/cmui-verify.kD2jpO`.

The final modal changes passed 22 focused behavior runs with equal motion, and 32 paired
fixture and theme comparisons with zero differing pixels. On the production Core route, the
historical palette accepted a query and returned focus to the launcher on Escape at both 390
and 1280 px. All 96 strict local fixture captures matched the starting revision again. Compared
with the stored set, each adapter has the same 44 of 48 differences and no missing images. The
browser evidence is `/private/tmp/cmui-final-restoration-browser.skV7MI`.

### Remaining compatibility differences

- The original package names and raw preset engine remain in the archived releases. The new
  paths preserve the component subpaths, browser styles, and Node loading conditions. Applications
  can use shared token overrides for current Vue and Vanilla styles. Old `.vf-*` selectors and
  theme tokens are tied to the archived component markup. [Migration guide](../migrate-from-vueforge.md)
- MenuBar uses a compact in-flow layout and a wide inline cascade. The historical portal and
  horizontal controls depend on a different layout strategy. An isolated hover and close-delay
  trial passed its interaction tests. The combined implementation exceeded the unchanged
  historical bundle limit, so the existing keyboard and click behavior remains in the release.
- Native overlay dismissal, close animations, and some presentation details differ from the
  reference. Native modal components use the top layer and manage focus immediately on close.
  DatePicker uses native clock selects. DataTable restores reordering and its resize guide, with
  current reorder motion. [Vue contract trace](historical-vue-core.md)

The next external action for the **UNVERIFIED** hosted gate is to publish an authorized
verification ref at the final SHA. Dispatch it with `gh workflow run ci.yml --ref <verification-ref>`.
Confirm that the `visual` job checked out that SHA on `macos-26`. Record the runner image, pinned
Chrome version and both strict comparisons against the existing stored images.
[CI workflow](../../.github/workflows/ci.yml)

## Continuation from f7471f59

**PARTIAL.** The product revision passed the local package and adapter parity suites and all
hosted gates. Historical navigation, overlay dismissal and package differences remain.

- The historical Vue MenuBar switches open branches on hover and closes after the original
  120 ms leave delay. Wide submenus use a positioned portal within the navigation landmark.
  Compact and server-rendered menus remain inline. Browser checks covered pointer and keyboard
  handoff, nested focus, clipping and live resizing (`170088ec`). Vue and Vanilla share the
  historical 320 ms submenu reveal (`08c6f8fb`).
- Dropdown, Popover and Tooltip restore the historical 320 ms fade, 4 px rise and 0.97 scale
  (`b4394b4e`). Native Dialog and Drawer restore their matching 220 ms fade and rise or 320 ms
  edge slide with backdrop fade (`beefa9fa`). Entry motion respects reduced motion. Native
  dismissal immediately releases modality and restores focus. A modal containing an anchored
  overlay fades in place so fixed panels stay aligned with their triggers (`c11d8460`).
  Independent Chrome verification passed 24 cases covering viewport placement, focus, reduced
  motion and dismissal before the fade ends. Four standalone Vanilla viewport and motion
  combinations also passed for inline Dropdown and portaled Tooltip. The Tooltip's own reveal
  left a horizontal offset under 1.4 px in this probe.
- The historical DataTable animates header and body cells during keyboard and pointer reorder
  (`d077fd73`). Pinned Chrome ran 30 scenarios across the current build and `d9879116`. Both
  used the same 220 ms timing, kept pinned columns fixed, rolled back on Escape, and skipped
  animations with reduced motion or more than 200 cells. The current build also kept header focus.
- Compact generated icon data and fixed regular glyph imports make room for the restored
  behavior inside the existing bundle limits (`36c3e38a`). The generator reproduced all 116
  icon geometries from the frozen source with identical decoded data.
- A generated Vite alias list preserves the 63 original Core and Layouts component subpaths
  during browser and bundled SSR migration (`756fe45c`). The browser receives the same CSS as
  the current package paths. Root package imports, the Layouts plugin and the raw runtime
  preset engine still require the archived releases or migration to shared tokens.
  [Migration guide](../migrate-from-vueforge.md)

The historical horizontal MenuBar controls require overflow navigation that keeps compact items
reachable with keyboard and touch. Restoring overlay exit motion requires retaining the closing
paint and portal position while releasing pointer, focus and accessibility ownership immediately.
Consumers of the raw preset engine and root package registrations can keep the pinned archived
packages until they migrate to the current entries and shared tokens. [Vue contract trace](historical-vue-core.md)

### Exact product candidate

Product revision `084d19ea0244e86813875fc4a744f9878e8d285b` passed all 20 clean package checks,
including 982 cold tests, 181 canonical accessibility cases, both production showcases and fresh
npm, pnpm and Yarn tarball installs. The production audit found zero vulnerabilities. The
development audit reported three low and 17 moderate findings. The native Vue and historical
aggregates measured 59.60 KiB and 79.43 KiB against their existing 60 and 81 KiB gzip limits.
Shared CSS measured 51,183 of 51,200 allowed gzip bytes. Package evidence is in
`/private/tmp/cmui-verify.v9FnLQ`.

In Chrome for Testing `151.0.7922.138` on macOS 27.2.1, all 96 stored-fixture captures matched
the corresponding `d9879116` Inter-injected captures byte for byte. The strict local stored
comparison again reported 44 of 48 differences per adapter, with zero missing or unexpected
images. The frozen reference reproduces the same 520 changed glyph pixels. Approved PNGs, the
rendering configuration and the comparison threshold are unchanged. [Renderer evidence](stored-visual-renderer.md)

Pinned Chrome passed all 144 behavior runs. All 362 Vue and Vanilla fixture pairs had zero
differing pixels and equal motion signatures. The historical, Vue and independent Vanilla
production showcases produced 48 viewport captures with zero script errors or horizontal
overflow. Against the historical showcase, the largest changed areas were 3.50% for Vue and
3.44% for Vanilla at the four-level RGB threshold. The Vanilla build includes 62 components
and 369 contract examples and variants. Browser evidence is in
`/private/tmp/cmui-browser-checkpoint.JtBwQZ`.

### First hosted run

GitHub Actions built `c11d8460` on `macos-26-arm64` image `20261102.0473.1`, macOS 26.7.2
(`25G332`), with Chrome for Testing `151.0.7922.138`. The two strict stored comparisons each
reported 48 captures with zero changed, missing or unexpected images. Six broader paired
comparisons failed across the two themes of `dropdown-composed`, `dropdown-open` and
`dropdown-pills`, so the hosted behavior step did not run. The seven other CI jobs passed.
[Hosted visual job](https://github.com/codemonster-ru/ui/actions/runs/43715133866/job/132814912035)

Pinned Chrome reproduced the paired failure with 6× CPU throttling and reduced motion. The
reduced-motion foundation rule gave all matching elements a nonzero transition duration. This
started a padding transition on the fixture container even though it declared no transition.
Vue measured the anchor at the viewport origin and retained that placement after the container
settled. Vanilla measured later. `084d19ea` disables CSS transitions in reduced-motion mode and
retains the shortened duration for animations. All 12 paired retests at 1×, 6× and 10× CPU
throttling matched at capture and again after settling. Independent traces are in
`/private/tmp/cmui-hosted-dropdown.nNE9Zy`. The paired stress results are in
`/private/tmp/cmui-drawer-slice.eY9Pwm/dropdown-c11-no-reduced-transitions.log`. Six further
paired captures against the committed build at 1× and 6× also matched at both checkpoints.
Committed-build stress evidence is in `/private/tmp/cmui-dropdown-084d19ea-stress.log`.

### Final hosted result

All eight GitHub Actions jobs passed at `084d19ea0244e86813875fc4a744f9878e8d285b` on
`codex/restoration-visual-c11d8460`. The `visual` job checked out that SHA on `macos-26-arm64`
image `20261102.0473.1`, macOS 26.7.2 (`25G332`), and installed Chrome for Testing
`151.0.7922.138`. It captured 96 screenshots and reported 48 comparisons per adapter with zero
changed, missing or unexpected images. All 362 paired fixtures matched in pixels and motion.
All 144 behavior runs passed with equal motion signatures.
[Hosted visual job](https://github.com/codemonster-ru/ui/actions/runs/43716556197/job/132819264193)

## Continuation from a019c059

**PASS for this continuation.** The restored behaviors passed the local checks and all eight
hosted jobs. The package migration and browser fallback boundaries are documented below.

- The CSS build removes authoring comments from distribution copies while retaining license
  notices and the original stylesheet entry paths (`6f1ae7cf`). With the baseline component
  sources this freed 4,626 gzip bytes. The shared scroll controls preserve the existing Tabs
  markup and styles (`47b92039`). Four pinned Chrome Tabs pairs matched in both themes.
- NodeNext now resolves the relative declarations exported by the Vue and Layouts packages
  (`ca60f755`). The packed consumer checks that `createVueForgeCore()` with `app.use()` accepts
  supported theme preferences, and that TypeScript rejects an old preset object and invalid
  layout props. Current layouts render through component imports and shared styles. Archived
  package roots and runtime preset configuration remain intentional migration boundaries.
  [Migration guide](../migrate-from-vueforge.md)
- Historical Vue MenuBar restores overflow controls with logical edges (`e4ff3dea`). At a
  390 px viewport, pinned Chrome matched the 215 px `d9879116` scroll step in LTR and RTL.
  The current component also passed touch swipes, wheel scrolling, grouped and nested keyboard
  traversal, disabled-item skipping, and focus retention during resize and hydration. Compact
  submenus stay reachable below the scroller. Server-rendered content wraps until hydration.
  Nine Vue regression tests, eight canonical interaction runs, and eight paired screenshots
  passed. Browser evidence is in `/private/tmp/cmui-menubar-overflow.R3Eudy`.
- Dropdown, Popover, Tooltip, Select, DatePicker, and MenuBar restore 320 ms exit motion
  (`11ce136a`, `e4ff3dea`). Closing panels are inert while their paint and placement persist.
  Pinned Chrome passed 20 Vue and Vanilla cases covering trusted pointer input, the accessibility
  tree, focus release, reduced motion and portal cleanup. The five frozen overlay controls used
  the same duration and easing. Evidence is in `/private/tmp/cmui-floating-exit.qmz0Uy`.
- Native Dialog, ConfirmDialog, CommandPalette, and Drawer restore their historical panel and
  backdrop exit (`11ce136a`). Chrome compared 28 current and `d9879116` cases at 390 and 1280 px.
  Dialog and ConfirmDialog faded with a 12 px downward shift over 220 ms. CommandPalette faded
  with an 8 px upward shift over 220 ms, and Drawer slid toward its edge over 320 ms. The stacked
  check kept the outer modal interactive, restored opener focus, and reported only that modal in the
  accessibility tree while the inner panel faded. Six adapter behavior runs verify native
  state, focus, hit testing, scroll release, and reduced-motion dismissal. Evidence is in
  `/private/tmp/cmui-modal-exit.bWViyn`.

Reduced motion and browsers without the required discrete transitions and CSS inertness use
immediate hiding. On direct native `dialog.close()` or form dismissal without an opener, the
browser can report the previous `activeElement` until its close event. The panel releases input
and keyboard trapping immediately, and adapter-managed dismissal also clears focus synchronously.
[Vue contract trace](historical-vue-core.md)

### Local verification

The exact product revision `e4ff3dea14ea7bc3a47a60abc9ae1a7be9377f25` passed all 20 clean quality
checks. They included 988 cold tests, 181 accessibility cases, both production builds, fresh
npm, pnpm and Yarn tarball installs, and the release audit. The audit reported zero production
vulnerabilities, with three low and 17 moderate development findings. The native Vue bundle
measured 59.97 of 60 KiB gzip and the historical entry measured 80.39 of 81 KiB. Runtime measured
79.85 of 80 KiB and shared CSS measured 47,474 of 51,200 bytes. Evidence is in
`/private/tmp/cmui-verify.6vvIwG`.

Pinned Chrome passed all 144 interaction runs and all 362 Vue/Vanilla fixture pairs, including
matching motion signatures. The three production showcases produced 48 captures with zero
script errors or horizontal overflow. The largest changed areas against the historical showcase
were 3.46% in Vue and 3.43% in Vanilla at the four-level RGB threshold. The Vanilla showcase
builds independently with 62 components and 369 contract examples and variants.

The local browser run used archive `68fbeae4`. The only later change before the final product
revision resolves an optional submenu ID in the Vue regression test. Both builds produced
byte-identical runtime assets for the two showcases and their packages. The 96 local captures
matched each other across adapters and matched the font-injected `d9879116` and prior `084d19ea`
captures byte for byte. The same 44 local stored-image differences per adapter come from the
documented glyph paint residual. The approved images, font configuration and thresholds
remain the same. Browser evidence is in `/private/tmp/cmui-browser-checkpoint.9XuT4u`.
[Renderer evidence](stored-visual-renderer.md)

### Hosted verification

All eight GitHub Actions jobs passed at `e4ff3dea14ea7bc3a47a60abc9ae1a7be9377f25` on the
dedicated verification branch. The visual job checked out that SHA on `macos-26-arm64` image
`20261102.0473.1`, macOS 26.7.2 (`25G332`), with Chrome for Testing `151.0.7922.138`. Both
48-image stored comparisons reported zero changed, missing or unexpected images. The same job
verified 362 pixel-identical Vue/Vanilla pairs with matching motion and 144 interaction runs
with zero failures or motion mismatches.
[Hosted visual job](https://github.com/codemonster-ru/ui/actions/runs/43729547790/job/132858739350)
