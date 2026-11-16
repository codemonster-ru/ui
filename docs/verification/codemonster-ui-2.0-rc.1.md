# CodeMonster UI 2.0 RC readiness

Reviewed November 16, 2026 on macOS 27.2.1. Product revision
`38e04e8307539687ba3afa5dba2bf6896bc640bd` is the source of the internal `2.0.0-rc.1` build.
The accepted Showcase v2 starts at `77ac04eef7f9d02ac97a2296fb37b59089c6fdcc`. The historical
Vue reference is `d9879116`. The release report is a documentation-only follow-up.

**Disposition** Internal candidate prepared. External release remains open on the gates in the
[remaining risk register](#remaining-risk-register). The [draft changelog](../codemonster-ui-2.0-release-notes.md)
lists the exact versions for all seven packages. Use the [release checklist](../release-checklist.md)
for the staged handoff and for any later authorized publication.

## Release changes

The shared search index promotes the Vue installation and quick-start sections for the framework
query. The compact Select preview fits its two options, each DataTable adapter displays the
requested order and restores the default order when sorting clears, and Dialog and Drawer
captions stay accurate while open. Dark DatePicker reference calendars use the secondary text
token for weekday labels and adjacent dates, including the portaled calendar. The latter is a
showcase-scoped change. Package CSS, API contracts and stored images retain their accepted
baseline. The four showcase changes and dark calendar contrast have focused browser regressions.

Vue and Layouts builds exclude test declarations and maps from tarballs. The package contract
checker rejects test build artifacts. Local verification builds declarations before typed lint
and workspace tests. npm 11.17.0 replaces 11.9.0 in release tooling because the older npm
misreported the existing secure `js-beautify` override as an invalid dependency in `npm ls --all`.

## Browser and accessibility results

| Check | Result |
| --- | --- |
| Playwright Chromium 147.0.7727.15, Firefox 148.0.2, WebKit 26.4 | Passed 288 canonical behavior runs per engine, 864 total. Each engine covered 72 scenarios across both adapters at 1440 × 900 light and 360 × 800 dark. |
| Production showcase regression | 128 route, theme and width combinations per engine across both adapters at 360, 390, 768 and 1440 px. Covered the shell, search, reference pages, guides and workspace. Narrow dark routes also ran 200% text reflow checks. |
| Live component interaction | 120 checks of ten reference frames across the three engines, adapters and viewport/theme pairs. Covered input and form behavior, Select, DatePicker, Dialog, Drawer, Dropdown, Popover, Menu Bar, Nav Menu and DataTable. |
| DatePicker variants | Tested time and portal variants across the three engines, both adapters and both sample viewport/theme pairs. Tested keyboard opening, calendar fit, time change and Escape focus restoration. |
| Automated accessibility | Passed 181 canonical fixture cases. Each production engine also passed 24 page axe scans and four targeted dark calendar contrast scans. The full 120-frame scan found no contrast violations and retained the iframe heading advisory listed below. |
| Native Safari 27.2 | Desktop smoke in a private window on the production build before the calendar contrast adjustment. Observed the Vue Select listbox open, `Vue` search place installation and quick start first, and the Vanilla Drawer open with its filter caption. Safari WebDriver was disabled, so the larger browser matrix used Playwright WebKit. |
| VoiceOver and NVDA | Manual verification pending. VoiceOver was installed, but the desktop bridge could not provide an observable screen-reader session. No usable Windows/NVDA session was available. |

The Firefox history test uses a native reload of the guide fragment. A plain HTML control
reproduced the duplicate same-URL history entry caused by Playwright's Firefox reload command.
The WebKit run used Option+Tab for native hyperlink traversal, including the initial skip link.
[Safari keyboard shortcuts](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac).

## Local quality and packages

Official Node 24.19.0 and npm 11.17.0 ran the clean checkout quality suite. Local logs include
`verify`, `test`, `typecheck`, `lint:all`, `build`, `check:packed-consumers`, `build:demo`,
`build:vanilla` and `prepublish:all`. The cold suite counted 1,002 workspace tests across Node and
Vitest. Documentation checking typechecked 73 generated examples. The packed consumers used npm
11.17.0, pnpm 10.34.5 and Yarn Classic 1.22.22.

Inspected all seven archives for manifests, license, repository and engine metadata, dependency and
peer ranges, all export targets, declarations, and generated payload. A fresh packed consumer
resolved 76 JavaScript exports, 66 supported CommonJS entries and 64 CSS exports. Strict NodeNext
declarations and Node and Vite SSR passed on Node 22.22.3, 24.19.0 and 26.0.0. Vite built all
63 browser-conditioned component entries. A standalone Vanilla install used five tarballs
without Vue, built its production bundle with theme, component, fonts and utilities CSS, and
exercised the Accordion controller. Separate CSS-only installs passed with all three package
managers. All seven simulated release tags selected `next`.

| Package | Version | Archive bytes | Files | CSS gzip KiB | JS gzip KiB |
| --- | --- | ---: | ---: | ---: | ---: |
| Tokens | 2.0.0-rc.1 | 15,975 | 41 | 3.10 | 5.29 |
| Icons | 2.0.0-rc.1 | 46,491 | 372 | 0 | 68.78 |
| Runtime | 2.0.0-rc.1 | 88,970 | 174 | 0 | 79.98 |
| CSS | 2.0.0-rc.1 | 212,130 | 82 | 46.52 | 0 |
| Utilities | 2.0.0-rc.1 | 5,315 | 4 | 2.86 | 0 |
| Vue | 2.0.0-rc.1 | 138,466 | 469 | 0 | 85.04 |
| Layouts | 2.0.0-rc.1 | 18,727 | 100 | 0 | 10.49 |

All seven package budgets and consumer tree-shaking gates passed with official Node. The full Vue
consumer measures 59.98 KiB gzip against 60 KiB and historical Vue 80.58 KiB against 81 KiB.
The Vue showcase's two static startup graphs exclude Shiki, TypeScript and Playground Core.
The release audit reported no known production advisories and no high or critical development
advisories. npm reported 20 development findings, 3 low and 17 moderate, in transitive lint,
test and Markdown tooling.

Pinned Chrome for Testing 151.0.7922.138 passed all 362 Vue/Vanilla visual pairs with zero pixel
differences and 144 paired behavior runs. The strict stored comparison returned nonzero on both
adapters with the known local renderer residual in 44 of 48 screenshots each. The same-browser
comparison with the accepted Showcase v2 build had zero pixel differences on all 96 canonical
captures at threshold zero. The later dark calendar change is in the showcase stylesheet and
leaves the canonical fixture inputs and package archives identical.
[Stored baseline renderer details](./stored-visual-renderer.md).

## Remaining risk register

| Risk | Status and next verification |
| --- | --- |
| Dark DatePicker package contrast | **Open.** The default package text measured 3.77:1 for weekday headings and enabled adjacent dates against the elevated dark background in all three engines. The showcase preview is corrected. A separate shared CSS correction and an open-state regression are needed for the package before release acceptance. |
| Assistive technology | **Pending.** Run VoiceOver in native Safari and NVDA on Windows. Confirm announcements for the search dialog and result count, Select choice and expanded state, DatePicker date and month, modal entry and return, menu traversal, and DataTable sort direction and reordered rows. Run the same cases in Vue and Vanilla. |
| Embedded preview headings | **Advisory.** The live axe matrix reported 72 `page-has-heading-one` results in Input, Select, Dropdown, Menu Bar, Nav Menu and DataTable frames. Their containing reference pages have headings and named frames. Review heading navigation in both screen readers. |
| Native Safari breadth | **Partial.** Desktop smoke passed. Repeat form, menus, DatePicker, table, focus and responsive checks with native Safari automation or manual coverage, including touch on iOS where available. |
| Hosted CI and historical pixels | **Pending.** Hosted CI needs a remote ref for the exact product SHA. The candidate is local and the requested scope excludes pushing. Previous hosted runs apply to earlier revisions. |
| Runtime gzip margin | **Open.** Official Node measured 79.98/80.00 KiB. Homebrew Node 24.19.0's system zlib measured the same JS bytes at 80.41 KiB. Use the official binary for budget comparison and recheck the margin after changes. |
| Registry install and provenance | **Pending.** Read-only registry lookups found all seven exact RC versions absent. Registry installation, npm dist-tags, provenance, integrity and release pages require a later authorized publication. |

## Local handoff

The seven archives, SHA-256 ledger and archive inventory are in
`/private/tmp/cmui-2.0.0-rc.1.L1xXXB/rc-archives`. The final verification transcript and command exit codes are in
`/private/tmp/cmui-2.0.0-rc.1.L1xXXB/logs` and `/private/tmp/cmui-2.0.0-rc.1.L1xXXB/results`. Browser matrix logs and
reproduction scripts are in `/private/tmp/cmui-rc-browser`.
