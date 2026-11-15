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
| IN PROGRESS | Inventory historical Vue core exports and component contracts; implement missing native components first, then reconcile existing behavior, types, and styles. |
| IN PROGRESS | Trace layouts, icons, themes, composables, styles and package entry points. Restore supported native contracts and test the new behavior. |
| IN PROGRESS | Restore CodeBlock and Playground showcase sections using their real packages. Verify source, editor, preview, and assets from a production build. |
| IN PROGRESS | Track Vanilla coverage against historical Vue and current contracts. Verify repeat initialization, mutations, destruction, and event cleanup. |
| DONE | Fixed Vanilla runtime observation of transient removals, cross-root moves and attribute changes. Runtime lint, typecheck, build and 206 tests passed on Node 24. |
| TODO | Extend Vanilla markup and enhancements for applicable restored contracts; verify keyboard and form behavior. |
| IN PROGRESS | Build the exact historical reference in isolation, compare both themes and viewports against the current showcases, and investigate visual differences. |
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

Finish and verify each coherent slice before committing it; then select the next unfinished row.
Record actual output and commands, including any check that cannot run, before advancing the
corresponding status.
