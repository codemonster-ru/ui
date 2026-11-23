# CodeMonster UI independent design review

## Final showcase approval

Status is **DESIGN APPROVED / RELEASE PENDING**.

The design was approved on November 17, 2026 at commit
`a9ab85e50a09ebf051f5749c9c394cf463f6de1c` on the `codex/showcase-art-direction` branch.
The approval covers the Core composition, Layouts with Warehouse and other interface examples,
Colors, and Icons in light and dark themes on desktop and mobile. The final review bundle
`codemonster-ui-final-showcase-polish.zip` contains 112 pairs of Vue and Vanilla captures.

All eight hosted CI jobs passed on the first attempt for the approved commit.
Chrome for Testing `151.0.7922.138` on `macos-26` verified 48/48 captures for Vue,
48/48 for Vanilla, 362/362 parity comparisons, and 144/144 behavior scenarios.
Integration uses the previously approved baselines from `cf6c4ab7`.
[Hosted CI](https://github.com/codemonster-ru/ui/actions/runs/44063914889)

A local comparison against the hosted PNGs on macOS 27.2.1 found 44 differences out of 48 per adapter.
The control commit `cf6c4ab7` produced the same result. All 96 local candidate captures matched
their local control captures byte for byte.
[Local comparison and Avatar instability](stored-visual-renderer.md#showcase-art-direction-and-avatar-parity)

| Release check | Status |
| --- | --- |
| VoiceOver | **PENDING.** Manually test Vue and Vanilla in Safari on macOS and record announcements and focus behavior. |
| NVDA | **BLOCKED.** The current matrix requires this check. A Windows session with NVDA is unavailable for acceptance testing. |

The [screen reader verification procedure](codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance)
and the [package release checklist](../release-checklist.md) apply to release acceptance.

## First-pass assessment

The first pass fixed confirmed state defects and made the catalog easier to use. The showcase still
needed clearer heading hierarchy within components, comparable variants across adapters, readable
dense tables, and visible interaction states. For example, the previous
[report](visual-excellence-initiative.md) attributes every ordinary-state change in 12 historical
captures to the borders of three fields. Their dimensions, content, font, and corner radii stayed
the same. Matching results in the two adapters confirmed that the changes carried over.

The source comparison uses two saved working-tree snapshots, one taken before the initial pass and
one before this review. Both include the showcase reorganization that was already in progress,
which makes it possible to isolate the edits from this initiative. The clean
`857c0e396077a7703a6b0b28c7c731fdb7f7befb` is the published starting commit. The two working-tree
snapshots contain additional changes.

| Area | What the first pass changed | Remaining issues |
| --- | --- | --- |
| Palette | Remapped three semantic roles, `border-interactive`, `border-strong`, and `text-muted` in [semantic-colors.ts](../../packages/tokens/src/semantic-colors.ts). The primitive OKLCH scales and status colors stayed the same. | Contrast on an elevated dark surface rose from 2.51:1 to 3.14:1 for interactive borders. The hierarchy of text and surface levels within individual components still needed work. |
| Typography | Raised the matrix H1 from 20 px to 28/34 px and added a Cyrillic specimen. | Card and Panel headings still used weight 400 at 16 px, just like body text. Dialog and Drawer headings also looked like body text. The package type scale and font families stayed the same. |
| Geometry and states | Restored visible focus and selected values in forced colors. Restored the selected Radio dot on hover and press. | Component sizes and padding changed little. Two inline buttons in compact Input occupied the same position. DataTable's 576 px minimum clipped even simple tables with 270 px available. |
| Spacing, radii, borders, shadows | Changed the matrix heading and navigation spacing and added section links. Some package border colors changed and a fallback focus outline was added. | The spacing, radius, border width, and shadow scales stayed the same. The first pass did not measure the spacing rhythm of every composition. |
| Showcase | Added nine section links, reliable keyboard landmarks, and styled the warehouse table. | The matrix still started with three theme cards, and Layouts presented abstract primitives before the working interface. On a wide screen, a single Button was hard to pick out in a 1248 px stage. |

The first pass directly changed individual forms, navigation and menu states, and focus on links and
buttons. Card, Panel, Table, DataTable, feedback components, and most layout components retained
their CSS geometry and visual hierarchy. The global semantic palette could have changed their
muted text or borders indirectly. The first pass focused on specific accessibility and showcase
defects. Component-by-component design acceptance required a broader review.

## Review method and criteria

The original and updated captures came from separately built catalogs. The main pages compare
Vue and Vanilla in both themes at 360 and 1440 px. For individual components, the review compares
published reference previews and contract variants. Interaction defects use live DOM measurements
and separate hover, press, focus, and open captures. The review assesses visible hierarchy,
readability, geometry, alignment, spacing, and the distinction between states in both themes.
Contract and axe checks appear in the verification section.

Each group prioritizes reproducible defects that affect reading or interaction. Font weights and
surfaces use existing roles to preserve the system's visual character and keep the adapters aligned.
The review records local verification, open design observations, and two release gates.

## Component review

The archive `artifacts/codemonster-ui-visual-excellence-design-review.zip` contains 13 findings
on actions and forms in `controls/audit.md` and 24 findings covering 81 feedback, navigation, and
overlay variants in `family-review/README.md`. The table covers the remaining 25 components with
contract captures. The names in the last column correspond to atlas captures.

| Component | Observation and decision | Evidence |
| --- | --- | --- |
| Link | In the default example, accent color alone distinguishes the link when it has no underline. Use the available always-underlined variant for links in running text. The geometry is clear and existing levels and variants were retained. | `link-default`, `link.css` |
| Card | At 16 px and weight 400, the heading looked like the first line of body text. Weight 600 distinguishes the heading at the same line height. Long words wrap. | `card-title`, `table/*/chromium/` |
| Panel | In Activity, the heading and content carried equal visual weight. Weight 600 follows the same rule as Card, including on the subtle surface. | `panel-default`, `panel-subtle` |
| GroupBox | The legend intentionally crosses the border. Heading, icon, and content insets read as a single composition. The native input looks different from library fields. A long heading is needed to check legend clipping. | `group-box-default` |
| Table | The simple table hid the Status column on narrow screens. Automatic sizing makes room for both columns. Headers at 14 px and weight 600 stand apart from the 16 px rows on a separate surface. | `table-default`, `table-presentation` |
| DataTable | The amount and name in Accounts extended past the right edge. Automatic sizing removes the 576 px minimum for simple data. Selected rows have a distinct background and a checkbox. Active sorting uses a different color and the indicator keeps a consistent width. Pinned columns retain scrolling. | `data-table-interactive`, `data-table-pinned`, `data-table-resizable` |
| ColumnChooser | The button outline is visible in both themes. The open list is aligned at the start and separates Select all with a divider. The panel inherits its size from Popover. | `column-chooser-default` |
| PageHeader | The 26 px heading at weight 600, the 16 px description, and the separate action row at narrow widths establish a clear hierarchy. It serves as a reference for proportions. | `page-header-default` |
| Container | Content has a consistent inset. Default and fluid look the same in the narrow capture. Their different uses are visible in Layouts, where width can be adjusted. | `container-default`, `container-fluid` |
| Grid | Columns collapse to one in the narrow contract capture without horizontal clipping. Layouts provides the comparison for a wide grid. | `grid-default`, Layouts |
| Inline | Save and Cancel share a visual axis. The contract capture intentionally includes a native button. | `inline-default` |
| Stack | The gap between First and Second separates the lines. The multiline form example gives a better view of content density. | `stack-default`, Forms |
| Section | The surface variant retains its padding and subtle border. The native Report heading sits close to the Ready line. A longer example is needed to assess vertical spacing with more content. | `section-surface` |
| AppShell | Product, Filters, Navigation, and Content keep their order, boundaries, and alignment on a narrow screen. The collapsible variant shows a native button. Layouts exercises the live Aside region. | `app-shell-default`, `app-shell-collapsible` |
| DocumentLayout | Guide, Version 2, and Chapters are separated by bands and a rule. The space around Body needs to be checked with a long article and sticky regions. | `document-layout-default`, Layouts |
| AdminLayout | The menu, Projects, and Dashboard occupy three distinct regions in the narrow capture. The application slot controls Dashboard density. | `admin-layout-default`, `admin-layout-collapsed` |
| AdminShell | A contrasting top bar and inset card define the composition. After scrolling 175 px, the page background showed through the bar and the inverse heading became hard to read. The bar now retains its inverse surface. | `before/*-admin-sticky.png`, `after/*-admin-sticky.png` |
| AuthLayout | The narrow central panel and Sign in heading establish a visual center in both themes. Custom form errors need a separate composition. | `auth-layout-default`, Auth preview |
| SetupLayout | The heading and short description sit above a separate action. The multi-step composition in Layouts complements the short contract example. | `setup-layout-default`, Setup preview |
| ErrorLayout | The code, heading, and action form a centered vertical axis. A pair of actions and a long description need additional examples. | `error-layout-default`, Error preview |
| HeaderArea | The bottom border marks the edge of the region. The Workspace inset matches adjacent regions in the composition. | `header-area-default` |
| SidebarArea | Padding and the border on the logical end are visible in both themes. Slot content determines the menu and density. | `sidebar-area-default` |
| ContentArea | Text starts on the shared grid. The region has no border, so the standalone capture mainly shows its surface role. | `content-area-default` |
| AsideArea | The border sits at the logical start, mirroring SidebarArea. Long content is checked in live shell examples. | `aside-area-default` |
| FooterArea | A top border and distinct surface mark the end of the composition. The Support text follows the shared spacing rhythm. | `footer-area-default` |

Of the two public compositions outside the manifests, **ConfirmDialog** is tested as a Dialog with
actions and inherits the new heading hierarchy. **ThemeProvider** is evaluated through theme
switching and token inheritance in both builds. Its effect is visible in the Theme section of the
matrix.

## Confirmed changes

- **Form geometry and states.** The two buttons in compact Input shared the same coordinates.
  They now have separate 24×24 px targets with a 4 px gap, and both work with a pointer. Select
  keeps its arrow when the clear control is visible, and a long option no longer expands the
  page from 390 to 698 px. The new height limit accommodates a three-line option and an
  adjacent row. DatePicker now has a distinct hover state and a separate readonly state.
  ThemeSwitch retains subtle hover and press feedback, and the focus outline fits within the
  4 px gap between segments.
- **Typography hierarchy.** Card and Panel use 16 px headings at weight 600 without taking up
  more vertical space. Dialog and Drawer use 18 px at weight 600. Alert distinguishes its
  heading with weight 600. In the review, a Cyrillic fragment measuring 554.5 px wrapped inside
  Alert and modal headings. ProgressBar moved its percentage out of the 8 px track into a
  separate 13 px slot with tabular numerals. The original 1% display showed only part of the
  percent sign. The updated label is readable from 0 to 100%, including in RTL.
- **Surfaces and data.** In a 270 px container, ordinary Table and DataTable examples now
  occupy 270 px instead of 576 px. Pinned examples still occupy 576–612 px and scroll.
  The heading surface role, tabular numerals, and distinct selected-row highlight make the
  rows easier to scan. An opaque AdminShell background separates the text from the working
  content during scrolling. The effect is visible in both adapters and both themes.
- **Color and spacing.** Hover now preserves the current NavMenu item. Disabled Accordion
  and Menu items are distinguished by weight and tone. The updated states use existing semantic
  surfaces, text colors, and sizes. They required no new primitive colors, font families, or
  global spacing, radius, or shadow scales. The changes address cases where the previous roles
  produced a weak hierarchy or incorrect geometry.

## Showcase review

Layouts brings the working warehouse interface into the first viewport. The table uses a semantic
caption, right-aligned numbers, text alongside status colors, and working pagination. Navigation to
shell examples sits alongside it. Theme now uses two coordinated areas in place of three separate
panels. On representative captures, Typography starts at y=497 instead of y=545 on desktop and
at y=595 instead of y=849 on tablet.

At a 1440 px viewport, the reference pages narrowed the preview column from 1248 to 1000 px.
Page navigation moved into its own column, and the simple Button now has an 80 px stage in both
builds, down from 112 px in Vue. Standard previews share the same autosizing logic. Embedded modal
and layout previews retain their specified minimums. The IconButton examples use library icons in
place of empty SVGs. With JavaScript disabled, both native Plan selects in Vanilla again show the
system arrow. Keyboard users can reach section links and warehouse pagination.

The matrix pages are easier to navigate, and the warehouse composition gives users a concrete
reason to explore the API. The 384 px-wide vertical form in a 1248 px space remains a weak spot.
Vue shows the Select component and Vanilla shows a recognizable native select, leaving a visual
difference between the examples. A design reference needs the same context and intended interaction
in both implementations. Following a direct link to Forms in Vanilla with JavaScript disabled
also shows outlines around both the section and its heading.

In the review archive, `showcase/measurements-after.jsonl` contains paired measurements and
`index.html` opens the offline atlas of original and final states. Both can be inspected
independently of the test results.

## Verification and release gates

- All 181 contract variants were captured before and after in both themes, for 362 captures per
  phase. Of those, 273 matched and 89 changed, including 18 with different capture dimensions.
  Differences covered forms, tables, headings, navigation state, progress percentages, and icons.
  The lists and dimensions are recorded in `atlas/component-before-after.json`.
- The review captured 248 reference previews per phase across both themes and adapters. It
  also retained before-and-after captures of the main pages and 28 separate pairs of composition
  screenshots.
- The first measurements of two light reference previews were taken while the iframe height was
  still changing. After it stabilized, Accordion matched in geometry and pixels at 998×99 px and
  Textarea matched at 998×120 px. The rerun covered both themes. Evidence is in
  `showcase/reference-recheck`.
- In the packaged Chrome 151, **362 Vue/Vanilla pairs** matched. All **144 behavior runs** passed
  with matching motion signatures. The before-and-after dark CommandPalette capture for the outer
  result differed by 11 pixels around the rounded corners of the focus outline.
- The final production builds passed **300 showcase combinations** in Chromium 157, Firefox 148,
  and WebKit 26.4, plus 24 axe page checks and 12 open-calendar contrast checks. Earlier full
  runs with Chromium 149 and local Chrome 151 stopped during page initialization or breadcrumb
  navigation. In Chromium 151, all nine isolated navigation checks passed across 320, 360, and
  1440 px. Logs from both types of run were retained.
- Measurements of tables, typography, and non-linear states yielded 18 matching Vue/Vanilla pairs
  in each of the three browsers. Six variants covered simple tables, sorting, selection, and pinned
  and resizable columns. Sticky bar captures were compared across four adapter and theme
  combinations.
- `npm test`, production builds, source contracts, SSR, type checks, package size checks, and
  181 contract accessibility checks passed locally. Forms passed nine tests in each of Chromium,
  Firefox, and WebKit. The Display/Navigation checks covered 12 adapter and theme pairs across
  three engines. Native links had separate checks with JavaScript disabled.
- For 48 historical captures per adapter, local Chrome for Testing 151.0.7922.138 showed 20 new
  before-and-after differences at threshold 0. Alert, Card, Input, Select, and DatePicker changed.
  The strict comparison against the approved PNGs at the existing threshold of 4 shows
  44 differences per adapter. The local differences include the existing font rasterization
  residual and intentional design changes. The original PNGs and thresholds were retained.

| Release gate | Status | Evidence at the time of this review |
| --- | --- | --- |
| Pinned hosted renderer | **BLOCKED** | GitHub Actions was available. The latest successful visual job covered the published `857c0e39` and predated the local candidate. The job was configured for `macos-26` and Chrome for Testing `151.0.7922.138`. The candidate needed a commit SHA and a run with those settings. [Visual job](https://github.com/codemonster-ru/ui/actions/runs/43869846096/job/133307803414) |
| Native assistive technology | **BLOCKED** | VoiceOver was installed. Launching it through the native bridge returned `timeoutReached`, and the app remained inactive. The only local Windows VM found was suspended and belonged to another task. No active NVDA session was found. The [RC.2 checklist](codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance) gives the manual verification criteria. |

## Open items from the review

1. **DatePicker at 320 px and 200% text size.** Six neighboring date pairs overlap and
   content reaches 335 px wide. A CSS experiment eliminated the overlap at the cost of breaking
   weekday labels and bunching two-digit dates. A shared localized compact layout needs end-to-end
   checks for ranges, time, and navigation. The original and final captures are in
   `controls/{before,after}`, and the measurements are in `supplemental-measurements.json`.
2. **Non-portaled Tooltip at the edge.** At a 390 px viewport, the tooltip starts at x=−4.25 px
   with its trigger at x=24 px. The text remains readable and the left border is clipped.
   Portaled tooltips account for the viewport. The default mode needs a positioning strategy
   verified in supported browser versions.
3. **Remaining composition details.** Design equivalent form examples for both showcases,
   verify that a deep link produces one clear focus indicator, and demonstrate complete empty,
   in-progress, error, and success states in realistic compositions.
4. **Coverage of the original assignment.** The review verified the inventory, both themes,
   comparisons of ordinary states, architecture, and targeted changes. Comprehensive coverage
   across public variants, custom slots, RTL, locales, 200% text size, and real touch devices
   remains open. The emulated interface measurements still need to be complemented by testing
   with native speech output.

**Design acceptance remained open at this stage of the review.** The local result was ready for
review. Resolving the DatePicker issue and verifying the approved baselines on the standard
infrastructure remained prerequisites for final acceptance.
