# CodeMonster UI 2.0.0-rc.2 readiness

Reviewed November 16, 2026. Product revision `6073806d98b84fb77dc488aa2fdcd6dbfa7fb4af`
follows the verified [RC.1 product](./codemonster-ui-2.0-rc.1.md) at `38e04e83` and the
subsequent browser harness wait for DataTable sorting. The evidence report is a documentation
follow-up to the product revision. The [release checklist](../release-checklist.md) remains the
acceptance contract.

**Disposition:** Internal candidate prepared. Publication remains pending on the open gates in
the [risk register](#risk-register). All seven packages use `2.0.0-rc.2`, with matching internal
ranges and changelog sections. No public API changes, migration steps, snapshot updates or changes
to the visual comparison thresholds were required. Theme overrides remain application-owned.

## Packaged DatePicker

RC.1 used `--cm-color-text-muted` for weekday headings, adjacent dates and the time label.
In dark mode this resolves to `--cm-palette-neutral-400` (`oklch(0.65 0.026 260)`) against
`--cm-color-background-surface-elevated`, `--cm-palette-neutral-750` (`oklch(0.33 0.02 260)`).
Both adapters reproduced the reported 3.77:1 in Chromium, Firefox and WebKit. The shared CSS now
uses `--cm-color-text-secondary` (`--cm-palette-neutral-300`, `oklch(0.745 0.02 260)`) for those
labels. The showcase override was removed. The existing accent token outlines selected dates and
ranges. A neutral border marks today; an underline preserves that cue when today is selected,
inside a range, or visibly focused.

| State, from browser computed colors | Dark | Light |
| --- | ---: | ---: |
| Weekday, enabled adjacent date and time label text | 5.39:1 | 6.25:1 |
| Hovered adjacent date text | 6.22:1 | 5.61:1 |
| Normal date text | 9.02:1 | 15.52:1 |
| Selected date text | 9.90:1 | 13.88:1 |
| Selected date border | 3.80:1 | 4.13:1 |
| In-range border | 3.80:1 | 4.14:1 |
| Current-date border | 3.78:1 | 4.78:1 |
| Keyboard focus ring | 5.70:1 | 5.89:1 |

Enabled text was checked at 4.5:1 and visual cues at 3:1, with a visible keyboard focus indicator.
[WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
[SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) and
[SC 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).
Native disabled dates and month-navigation buttons could not take focus or activate, and their
hover surface did not change. The inactive-control exception applies to their text and visual cues.
Enabled adjacent dates have no such exception.

**Pass:** the [browser regression](../../scripts/visual/check-date-picker-contrast.mjs) loads the
built package stylesheet with no showcase styles and passed all 12 engine, adapter and theme
combinations. It covers normal, hover, selected, range, current, focus-visible and disabled states;
axe found no open time calendar contrast violations. The regression failed against the RC.1 package
CSS. Run `npm run build` and `npm run visual:cross-platform:serve` from the repository root, then
run `node --test scripts/visual/check-date-picker-contrast.mjs` with `SHOWCASE_BROWSER` set to each
of `chromium`, `firefox` and `webkit`, and `SHOWCASE_PLAYWRIGHT` set to the installed Playwright
module directory as needed.

## Distributable packages

Built and packed each workspace from the exact product commit with official Node 24.19.0 and
npm 11.17.0. Inspected archive contents for package metadata, license, dependency and peer ranges,
export targets, declarations and built payload. Verified every tarball's SHA-256 and npm SHA-512
integrity. The DatePicker component CSS, full CSS and theme CSS in the tarballs match the browser
fixture files byte for byte. Comparing the actual RC.1 and RC.2 tarballs found one changed file
under `dist`: `components/date-picker.css`. The aggregate stylesheet imports it. All seven
simulated prerelease tags selected `next`.

| Package | Archive bytes | Files | CSS gzip KiB | JS gzip KiB |
| --- | ---: | ---: | ---: | ---: |
| Tokens | 15,976 | 41 | 3.10 | 5.29 |
| Icons | 46,491 | 372 | 0 | 68.78 |
| Runtime | 88,969 | 174 | 0 | 79.98 |
| CSS | 212,174 | 82 | 46.56 | 0 |
| Utilities | 5,316 | 4 | 2.86 | 0 |
| Vue | 138,468 | 469 | 0 | 85.04 |
| Layouts | 18,730 | 100 | 0 | 10.49 |

**Pass:** all seven package budgets, dependency contracts and consumer tree-shaking. The full Vue
consumer measured 59.98/60 KiB gzip and the historical Vue consumer 80.58/81 KiB. The Runtime
package remains close to its 80 KiB limit. These measurements use the official Node distribution.

**Pass:** npm 11.17.0, pnpm 10.34.5 and Yarn Classic 1.22.22 each installed the release tarballs
in isolated Vue and CSS-only fixtures. Checks covered TypeScript Bundler and strict NodeNext
resolution, full and component CSS distribution, browser auto CSS, pruning unrelated CSS, ESM,
supported CommonJS, Node SSR and Vite SSR. A five-tarball Vanilla install built without Vue
and exercised the Accordion controller.

The export sweep passed on official Node 22.22.3, 24.19.0 and 26.0.0: 76 ESM exports, 66
supported `require` entries, 64 CSS exports and strict NodeNext declarations with Node and Vite
SSR. Vite resolved all 63 browser-conditioned entries.

## Hosted CI

**Pending:** authenticated, read-only GitHub access was available and the `CI` workflow was active.
The exact SHA returned HTTP 422 (no commit found) and a workflow run count of zero. Remote `main`
was `f51882eab03ba1b8e0b7e72f66e7375ff79bc42d`; no remote ref contains this candidate. A workflow
run for RC.2 requires an authorized remote ref at the product SHA. No ref was pushed and no
workflow was dispatched. Earlier hosted runs do not qualify this candidate.

After the ref is authorized, confirm that the run's `head_sha` equals the product revision and
inspect `lint`, `typecheck`, `contracts`, `source-tests`, `packaging`, `packed-consumers`, `hygiene`
and `visual`. The last job must pass both strict historical comparisons on `macos-26` and both
paired adapter checks.

## Historical visual acceptance

On local macOS 27.2.1 with Chrome for Testing 151.0.7922.138, the strict comparison to the
stored images **failed locally** on each adapter: 44 of 48 frames differed at threshold 4,
with 520 of 559,172 pixels flagged per adapter and no missing or unexpected frames. The 96
same-renderer comparisons against the matching RC.1 captures passed at threshold zero with
zero changed pixels. This reproduces the
[known local renderer residual](./stored-visual-renderer.md); the hosted strict result remains
pending. Approved snapshots and thresholds were left intact.

## Browser and accessibility checks

Playwright used Chromium 147.0.7727.15, Firefox 148.0.2 and WebKit 26.4. The repository automated
accessibility check passed its five harness tests and all 181 canonical cases. Browser coverage
included real keyboard actions, focus containment and return, role and name, state changes and
row order, validation feedback, and open overlays in both adapters.

| Check | Result |
| --- | --- |
| Canonical behavior | 864 runs passed: 72 scenarios per adapter in two theme and viewport pairs per engine. Included keyboard, overlays, focus return, selection, table sort and navigation scenarios. |
| Production showcase | 384 route, theme and viewport combinations across the three engines and both adapters; 72 top-level axe scans and 12 open dark calendar contrast scans passed. Covered navigation, search, references, guides, the workspace, keyboard and touch input, and 200% text reflow at narrow width. |
| Open component frames | 120 interactions passed across the three engines and both adapters at 1440 px light and 360 px dark. Covered forms, Select, DatePicker, Dialog, Drawer, Dropdown, Popover, MenuBar, navigation and DataTable. The unfiltered frame scan reported only 72 `page-has-heading-one` best-practice advisories and returns nonzero for them. |
| DatePicker time and portal | 24 checks passed for opening, popup fit, Escape, focus return, contrast and time entry. |
| Status and validation semantics | 36 checks passed across the three engines, both adapters and both sample themes and widths. Covered live search results, DatePicker month and focused date, native required and app validation errors, focus, and form success status. These checks inspect browser semantics, not speech. |
| Chrome adapter parity | All 362 paired visual cases matched with zero changed pixels; animation signatures matched for eight animated cases. All 144 paired behavior runs passed. |

The original concurrent Firefox production runner passed on retry but could time out while
waiting for a DataTable sort change. A controlled probe reproduced competition between adapter
pages for document focus: a background page received the Enter key events but Firefox did not
activate the sort button. A one-page-at-a-time control passed all 20 sort cycles. The test
harness follow-up `963af5ce` serializes the Firefox adapters and retains the route, state and keyboard
assertions. The updated Firefox runner passed all 128 route combinations and associated checks.
The application code and artifact contents are unaffected.

Native Safari 27.2 desktop smoke on the rebuilt Vue DatePicker exposed the collapsed and expanded
combobox, the named calendar and month grid, and complete date labels. Escape closed the calendar.
VoiceOver was installed but inactive; the desktop bridge did not start it with the native shortcut
and timed out opening it directly. No speech or captions were observable. No Windows/NVDA session
was available.

## Manual assistive technology acceptance

Use native VoiceOver with Safari on macOS and NVDA with Firefox or Chrome on Windows. Execute
these checks for both the Vue and Vanilla production builds. Record the OS, browser and reader
versions, reader settings, spoken output and focus after each action. A browser accessibility tree,
DOM assertions and axe cannot verify the spoken output.

| Area | What to listen for and verify |
| --- | --- |
| Dialog and Drawer | Open from the keyboard. Hear the modal name and description on entry; verify initial target, Tab and Shift+Tab containment and no background interaction. Close with Escape and with the close control, then confirm the opener is focused and announced. |
| Select | Hear the field label and expanded or collapsed state, then move through options and confirm the option name, current selection and disabled state are conveyed. Commit and cancel with the keyboard; verify focus, announced value and form submission. |
| DatePicker | Hear the input and trigger labels, month and year on opening and month navigation, weekday and full date, today, selected and unavailable states while navigating the grid. Commit a date and, for the range variant, both endpoints; verify the announced input value. Test Escape and focus return, including the portaled and time variants. |
| MenuBar and Dropdown | Confirm button/menu names, expanded state, item names and state, and submenu announcements where present. Exercise arrows, Home/End, Enter, Escape, and focus return. |
| DataTable | Navigate caption, headers, cells and rows with reader table commands. Activate a sort control repeatedly; confirm ascending and descending direction and that table navigation reaches rows in the new order with coherent header associations. |
| Forms and validation | Hear labels, required and invalid state, help and error text. Submit an invalid form, correct the input and resubmit. Confirm how validation changes are conveyed and focus remains usable. |
| Showcase search and embedded previews | Hear the search dialog name, result-count updates and empty state, and verify result activation and Escape focus return. Test heading and frame navigation around live previews; the outer page's heading does not appear inside the nested document. |

## Local quality

**Pass:** the complete local suite ran from a `git archive` of the product commit. It included
`verify`, `test`, `audit:release`, `typecheck`, `lint:all`, `build`, `check:packed-consumers`,
`build:demo`, `build:vanilla`, `prepublish:all`, the CSS packed consumer unit tests, and a clean
`npm ci` with `npm ls --all`. The cold workspace suite ran 1,002 tests; the documentation checker
typechecked 73 generated examples. npm reported no production advisories and no high or critical
development advisories (3 low and 17 moderate development findings).

The old deferred-runtime script points to the retired `examples/vue/dist` layout. The current
`examples/ui-showcase` build was checked directly: neither static startup graph contains Shiki,
TypeScript or VueForge Playground Core; both entry chunks are within 95 KiB gzip. The deferred
TypeScript worker is within 3,700,000 bytes raw and 1,100 KiB gzip; no other JS chunk exceeds
500,000 raw bytes. The existing numeric limits were used.

## Risk register

| Gate or risk | Status and next verification |
| --- | --- |
| Packaged DatePicker contrast | **Pass.** Both adapters load the corrected package CSS. All three engines passed the focused browser regression. |
| VoiceOver and NVDA | **Pending.** The local native Safari smoke exposed DatePicker semantics, but VoiceOver did not yield an observable reading session; there was no usable Windows/NVDA session. Run the manual checklist above. |
| Embedded preview headings | **Advisory.** Some live frames lack an H1 of their own. The containing reference page has a heading and each frame has a name. Confirm the navigation experience in both native readers. |
| Native Safari breadth | **Partial.** The native DatePicker smoke passed. The full matrix used Playwright WebKit. Repeat forms, menus, table, focus and responsive behavior in native Safari and cover iOS touch when available. |
| Hosted CI and strict historical pixels | **Pending / local strict comparison failed.** Authorize a remote ref at the recorded product SHA, then inspect all eight jobs. The clean same-renderer RC.1 comparison does not replace the hosted strict gate. |
| Runtime and full Vue size margins | **Pass on the release toolchain; narrow margin.** Runtime is 79.98/80 KiB gzip; full Vue consumer is 59.98/60 KiB. Recheck with official Node on the next change. The historical Homebrew zlib discrepancy is documented in RC.1. |
| Registry installation and provenance | **Pending.** Read-only `npm view` checks returned E404 for all seven exact versions (Icons and Layouts were absent by package name). Repeat the registry consumer, dist-tags, provenance, integrity, signatures and release page checks after separately authorized publication. |

The handoff ZIP at `artifacts/codemonster-ui-2.0.0-rc.2.zip` contains all seven npm tarballs, a
manifest, product revision, release notes, verification evidence and `SHA256SUMS`. The sibling
`.zip.sha256` verifies the ZIP against its local digest. Publication gates are still open.
