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
| TODO | Run package checks, lint, type checks, tests, browser behavior and accessibility checks, production builds, and fresh packed consumers. |
| TODO | Review independently as Vue consumer, server-rendered Vanilla consumer, and future adapter maintainer. Address actionable findings and rerun affected checks. |
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

Finish and verify each coherent slice before committing it; then select the next unfinished row.
Record actual output and commands, including any check that cannot run, before advancing the
corresponding status.
