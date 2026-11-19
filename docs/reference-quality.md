# CodeMonster UI reference quality roadmap

This record covers the Reference Quality branch before consolidation. The [reference integration
record](./verification/reference-integration.md) covers the combined candidate.

This roadmap continues the [maturity roadmap](./codemonster-ui-roadmap-v2.md) after
`857c0e396077a7703a6b0b28c7c731fdb7f7befb`. The [RC.2 evidence](./verification/codemonster-ui-2.0-rc.2.md)
covers its recorded local and hosted revisions. The working branch is `codex/reference-quality`.
Open showcase and release proposals have separate review and integration histories.

## Working rules

- Audit, plan, implement, verify, review, then commit a small change before selecting the next item.
- Preserve native HTML, server rendering, progressive enhancement, and existing public contracts.
  An incompatible API proposal requires a versioning and migration decision.
- Keep a verified baseline and compare intentional visual changes with a control using the same
  renderer. Record geometry, affected states, and before and after captures. The hosted baseline
  workflow retains its comparison threshold.
- Use the [component quality matrix](./components/quality-matrix.md) to choose coverage. Keep
  source, automated browser, manual assistive technology, and hosted results attributable to the
  revision and environment that produced them.
- Close an item when its acceptance and verification are both recorded. Use **In progress** for
  incomplete work, **Open** for work ready to start, and **Deferred** when a decision or environment
  is missing. Stop adding work when the remaining differences have no demonstrated user impact.
- P0 is critical, P1 materially impairs supported use, P2 improves product quality or DX, and P3
  covers optional polish.

## Queue

| ID    | Priority | Problem and expected outcome                                                                                                                                                                     | Acceptance                                                                                                                                                                       | Verification                                                                                      | Status                                  |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| RQ-01 | P1       | Vue Select and DatePicker forward caller attributes onto internal controls that own form and popup semantics. Preserve the trigger, popup relationship, and caller-owned naming and description. | Native activation has the intended form behavior and combobox state remains valid in Vue SSR and after mounting.                                                                 | Red and green mounted and SSR regressions, Vue typecheck and package consumer checks.             | Verified in focused suites              |
| RQ-02 | P1       | Tabs, Accordion, and Menu drop native Vue keydown listeners. Drawer can lose attributes added after mount. Preserve native listeners and respect canceled input.                                 | Root receives the original event once and normal navigation, nested ownership, and menu dismissal work.                                                                          | Mounted keyboard and listener regressions, hydration coverage and browser scenarios.              | Verified in focused suites              |
| RQ-03 | P1       | A long translated GroupBox legend or TableOfContents link can force two-dimensional scrolling. Keep the complete labels within a narrow composition.                                             | At 320 CSS px and 200% text the document stays inside the viewport, text is visible, and disclosure and native fragment navigation work.                                         | Same-renderer captures and geometry in three engines, both themes, LTR and RTL.                   | Verified                                |
| RQ-04 | P2       | A first visit leaves setup, package roles, contribution, and private reporting hard to find. Give each a direct, verified entry.                                                                 | README identifies the published and checkout flows, shows the product, links all seven packages, and explains support. GitHub presents the documentation and the product scope.  | Fresh stable install, links, Markdown and documentation gates, GitHub read-back.                  | Verified                                |
| RQ-05 | P2       | The deferred-runtime checker refers to a retired showcase path. Restore reproducibility of the current demo's entry and worker checks.                                                           | The build used by the release checklist can reproduce the graph and size verification with the existing limits.                                                                  | Verify both HTML entries, deferred graph, compiler worker, and non-worker JS chunks.              | Verified                                |
| RQ-06 | P2       | The canonical inventory establishes catalog presence. A coverage view should reveal fixture or interaction gaps and where existing APIs overlap.                                                 | Every canonical component appears with its Vue export, declared states and counted evidence. New components require a concrete use case that the library cannot already compose. | Reconcile manifests, docs index, exports, SSR evidence, and controller declarations.              | Verified                                |
| RQ-07 | P1       | RC.2 records pending native assistive technology acceptance. Confirm speech, focus, and state changes in native readers.                                                                         | Record both integrations with native VoiceOver/Safari and NVDA on Windows against the existing manual checklist.                                                                 | Native keyboard and speech observations with reader, browser, and OS versions.                    | Deferred pending usable native sessions |
| RQ-08 | P2       | Multiple quality and release proposals touch the same product. Integration needs evidence for the resulting revision.                                                                            | Review the combined diff and any intended screenshot changes, resolve overlaps in scope, and record candidate and hosted results.                                                | Independent integrated review, strict comparisons on the hosted renderer and Chromium smoke.      | Open                                    |
| RQ-09 | P1       | Some interactive states have limited target-size, forced-colors, and locale coverage. Establish which defects affect supported compositions.                                                     | Resolve the confirmed compact target, forced-colors focus, DatePicker reflow and Tooltip placement cases in the integration candidate.                                           | Use published CSS, focused browser tests and native Windows High Contrast.                        | Deferred to reviewed visual candidate   |
| RQ-10 | P2       | The showcase reflow pass could retain the default font size, and theme setup attempted storage in sandboxed iframes. Verify effective text scaling and seed the theme in the top document.       | Computed root size doubles before measuring layout and theme initialization remains outside sandboxed frames.                                                                    | Dark 360 px in both production showcases and three engines, plus a Chromium sandbox reproduction. | Verified                                |
| RQ-11 | P2       | Package boundaries describe hypothetical adapters and an empty Razor section. Make current ownership and the Layouts peer dependency explicit.                                                   | Docs describe the shipped Vue, Layouts and Vanilla responsibilities and link the separate Razor integration.                                                                     | Compare seven manifests and present platform guidance, run documentation checks.                  | Verified                                |
| RQ-12 | P1       | Vue components that cache the fallthrough attribute set can drop attributes added after mount. Preserve updates across affected components.                                                      | Initially empty and populated attribute sets accept later addition, replacement and removal. Keep existing owned bindings and render output.                                     | Red and green representative adapter tests, independent review, SSR and package consumer checks.  | Verified in focused suites              |

## Continuation

Start with the highest-priority actionable item. Use the acceptance row to choose the smallest
useful change and record the exact revision, commands, and observed result in the evidence below.
For hosted or native checks that require another environment, continue the independent product
work and leave the affected gate open.

## Evidence

The RC.2 release record supplies historical evidence for package consumers, native Safari smoke,
three browser engines, and the pinned hosted visual comparison. The
[renderer investigation](./verification/stored-visual-renderer.md) records residuals seen in local
comparisons. The quality matrix links source fixtures and counts their coverage.

### End-to-end product evidence

- Chromium 149, Firefox 148 and WebKit 26.4 each completed 128 production showcase combinations
  after correcting the root font-size selector. Per engine, 24 page axe scans and 4 dark
  DatePicker contrast scans passed. Seven top-level pages in each adapter exercised a verified
  doubling of text size at 360 px. Embedded examples retain their own document styles.
  Chromium initially timed out waiting for the theme on the default static server. The logs
  also exposed a separate storage error, reproduced with an isolated sandboxed frame. The
  theme seeding fix resolves that error. Chromium 149 passed the full matrix when served by a
  quiet threaded static server with a larger connection backlog. Chromium 147 also passed on
  that server. The timeout's cause remains unconfirmed.
- The dedicated GroupBox and TableOfContents browser test covers those component documents at
  320 px and twice the default text size. It passed 48 combinations across the three engines,
  Vue and Vanilla, both themes, and LTR and RTL. Chromium document scroll widths changed from
  1,341 and 589 px to 320 px. All 16 control captures of standard short titles matched in geometry
  and SHA-256. The GroupBox legend uses the available fieldset width, aligns long text to the
  inline start, and keeps the original trigger and disclosure indicator. The table of contents
  wraps its labels while retaining the native heading destination. A first-line chevron prototype
  moved the standard icon by 2.4 px. Automatic hyphenation lengthened the test heading. The
  accepted change keeps the standard layout and fits the full text.
  [Understanding reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and
  [Understanding resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
- Production Chromium sampled Core, Workspace, and Colors in both adapters. The measured
  Workspace Button, Input, and Select were all 44 px on mobile and 36 px on desktop, with 1 px
  borders and 10 px radii. Select's chevron measured 16 × 16 px. Workspace spacing between
  filters was 12 px. Core title and section sizes were 30/23 px at 360 px and 52/23 px at 1,440 px.
  The lowest displayed contrast pairs were 4.54:1 for enabled text, 3.18:1 for an interactive
  boundary, and 5.89:1 for a focus indicator. These values describe the sampled composition
  and token pairs.
- The browser harness, before and after captures, default control measurements, and composed
  showcase samples are retained locally under `artifacts/reference-quality/`. The focused tests
  use the built packages from `npm run build` with `npm run visual:cross-platform:serve` running.
  Use `SHOWCASE_BROWSER` to choose an installed engine and run
  `node --test scripts/visual/check-long-label-reflow.mjs`.

### Repository and GitHub review

GitHub reports the MIT license, active Issues, public visibility, and an active rule protecting
`main` from deletion and non-fast-forward updates. The repository description, eight topics and
documentation homepage were applied and read back. The README, contribution and security guidance,
bug form and PR template are in the improvement branch. The private reporting address is the
organization's published contact. GitHub uses its default social image and Issues for public
support. Review a custom image, Discussions and the code of conduct with the maintainers.
Private vulnerability reporting and changes to protected rules are owner decisions. Dependabot
dependency alerts reported zero open alerts. Automated version updates had no repo configuration.

The hygiene review examined 1,650 tracked paths. Identical fixture HTML, PNG evidence, package
licenses, configs, and separately named brand assets have their own consumers. All seven packages
use explicit distribution allowlists. No accidental archives or generated build outputs were
found in Git. The obsolete checker for the retired showcase path was replaced by a shorter check
against the live Vite build. The existing release verification records retain the historical
results.

### Local integration evidence

The product changes through `ce05ab06` passed `npm run verify` on Node 24.19.0 and npm 11.17.0.
That run covered the clean install, source tests, SSR, lint and types, 181 canonical accessibility
cases, 73 executable documentation fixtures, tarball consumers in npm, pnpm and Yarn, seven package
budgets, tree shaking, and dry-run packaging. The Vue workspace ran 324 source and 259 published
build tests. Layouts ran 20 source tests. The dependency audit reported zero production findings and
20 development findings below the high threshold, including 17 moderate and 3 low.

The production demonstration builds and the restored deferred-runtime command passed. The Vue
index entry measured 50.11 KiB gzip and the component case entry 4.09 KiB against the 95 KiB
per-entry budget. The worker measured 3,598,811 bytes raw and 1,006.05 KiB gzip. The full Vue
consumer measured 59.88/60 KiB gzip and its historical namespace 80.50/81 KiB. The packaged runtime
remains close to its existing 80 KiB cap at 79.98 KiB.

Chrome 157 completed 362 paired Vue and Vanilla captures with zero pixels above the existing
channel tolerance and matching motion on eight animated cases. The 144 behavior runs also passed,
with matching motion signatures. These local captures compare the two adapters on the same
renderer. The hosted comparison to the checked-in reference images is tracked in RQ-08.

### Independent reviews

| Review                         | Result                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product design                 | A same-renderer review checked GroupBox and TableOfContents overflow, normal-state controls, and the composed Core, Workspace and Colors samples. The shared CSS carries the change for both adapters.                                                                                                                                                      |
| Component API and completeness | All 62 manifests reconcile with Vue exports, the guide index and their showcase groups. The review confirmed form ownership and keyboard bugs, caught the DatePicker weekday normalization edge, and verified render-time attribute forwarding across 40 additional implementations.                                                                        |
| Architecture and performance   | The layout layer's Vue peer relationship matches the published manifests. A separate reviewer verified lazy route reachability and improved the Vite graph check so an eager Playground dependency on another route fails.                                                                                                                                  |
| Repository and GitHub          | The tracked inventory, packaging allowlists, workflow entry points, contribution paths and metadata were inspected. Candidate CI and protected settings remain separate acceptance items.                                                                                                                                                                   |
| Documentation and DX           | The stable registry install succeeded in a clean consumer. The old coverage gate saw 49 components. Exact Vue export and usage-guide checks now see all 64, including compatibility-grouped declarations and the two recipe-level components. The Drawer guide includes a working example.                                                                  |
| Accessibility                  | Browser reflow, keyboard focus, disclosure, popup relationships and sampled contrast passed at the stated widths and settings. Speech, native Windows High Contrast, and the additional forced-colors fixes need further acceptance.                                                                                                                        |
| Integrated source review       | Independent reviewers reproduced nine stale-attribute regressions on the baseline and compared the transformed implementations token by token. A tenth regression covers a populated attribute set cleared and re-added. Separate reviewers checked native listener order, owned picker attributes, CSS reflow, guide coverage and deferred runtime checks. |

### Open integration and platform evidence

The confirmed forced-colors focus and state issues on this branch already have prepared fixes in
[PR #27](https://github.com/codemonster-ru/ui/pull/27) at `d2057806` and in the separate precision
branch. Their changes also cover compact clear targets, narrow DatePicker reflow, and inline Tooltip
placement. The draft passed its own eight-job hosted check. Its larger changes to the showcase,
CI, lockfile and stored reference images require review as a combined integration, so this pass
keeps the branches independently reviewable.
[PR #27 CI](https://github.com/codemonster-ru/ui/actions/runs/44067047059).

The next integration operation is to compare the two product diffs in an isolated worktree and
select which visual candidate will carry the confirmed fixes:

```bash
git diff codex/reference-quality d2057806 -- packages/css/src packages/vue/src examples
```

Reconcile overlapping fixes, run the focused browser regressions on the combined build, then
verify the strict captures on the hosted renderer. A dry merge of `ce05ab06` with `d2057806`
reported content conflicts in `README.md` and `docs/release-checklist.md`. The simulation used `git merge-tree`. Use the
[RC.2 manual checklist](./verification/codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance)
when VoiceOver/Safari and NVDA sessions are available. Close the product direction once that
evidence and the integration decisions are recorded.

## Readiness by direction

| Direction                               | Assessment                                                                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual design, geometry and composition | Sampled in the live Core, Workspace, forms, table, navigation and overlay examples. Reflow is verified for the changed components. Prepared compact-control and overlay refinements still need product integration.         |
| Color and typography                    | Sampled semantic contrast, heading hierarchy, control dimensions, border weights and spacing align across the measured Vue and Vanilla compositions. Exhaustive state coverage and native forced colors are open.           |
| Public API and component coverage       | The catalog and guide coverage reconcile. The corrected form, keyboard and fallthrough contracts passed local SSR and interaction tests. Existing components cover the demonstrated cases without expanding the public API. |
| Architecture and maintenance            | The shared CSS, canonical DOM, behavior core, and Vue adapter keep their ownership boundaries. The layout package's Vue peer dependency and the render-time attribute convention are explicit.                              |
| Developer experience and documentation  | Stable onboarding, checkout quick starts, guide links, examples and contribution paths are verified. API coverage is enforced for all 64 exports.                                                                           |
| Accessibility                           | The local browser and canonical scopes passed. Native reader announcements, Windows High Contrast and integrated focus, target-size and overlay fixes remain acceptance items.                                              |
| Performance                             | The seven package size budgets, consumer tree shaking and showcase lazy-load budgets passed. The runtime and full Vue margins merit rechecking when their inputs change.                                                    |
| Repository and engineering              | Tracked inventory, dependency graph, CI and release tooling were reviewed. The old example verifier was replaced. The quality queue records evidence and continuation after each meaningful iteration.                      |
| GitHub presentation                     | About, topics and the documentation homepage are live. README, forms and contributor guidance are available in the improvement branch. Social presentation and moderation assignments remain open.                          |
| Integrated deliverable                  | This branch has local product evidence and independent review. An exact combined candidate, hosted visual check and native accessibility acceptance are still pending.                                                      |
