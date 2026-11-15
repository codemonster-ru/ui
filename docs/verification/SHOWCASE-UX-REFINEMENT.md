# Showcase and documentation UX refinement

Start: `ebbb0b9d` on `main`. The supplied visual review and ZIP were already untracked and
remain in place. The ZIP integrity check passed. Product references `e4ff3dea` and `1733d1f8`
and the historical Vue reference `d9879116` were inspected. This change is scoped to the private
showcases and their guides; published package source, exports, tokens, CSS, contract fixtures,
and approved visual baselines are unchanged.

| Priority | Work                                                 | Result                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Inspect the visual review and live production builds | Confirmed multirow mobile navigation (133 CSS pixels at 360), catalog names without descriptions, an unintegrated documentation experience, and Core calendar, tooltip, and form layout defects.                                  |
| P1       | Shared navigation and discovery                      | Four primary links, grouped resources, a one-row mobile header, visible active sections, an accessible disclosure, and one keyboard-operable search for components, guide headings, and showcase pages.                           |
| P1       | Catalog and references                               | Category and purpose filtering, descriptive cards, breadcrumbs, an in-page outline, real previews, Vue and Vanilla snippet tabs with Copy, readable contract entries, and links to accessibility guidance and related components. |
| P1       | Integrated guides                                    | Compile 67 authoritative Markdown sources at build time, with raw HTML disabled and internal links rewritten. Vue loads the selected guide; Vanilla serves full HTML. Both builds emit directory indexes and one search index.    |
| P1       | Narrow layout                                        | Keep calendar popups above adjacent controls, let edge tooltips use the existing portal option, and contain Core form controls, typography, and readable reference previews.                                                      |
| P2       | Release Workspace                                    | Move status to a dedicated summary, align filters with deployment results, and give release creation a clear entry point. The same four views and local interactions remain available.                                            |
| P1       | Review, verification, and evidence                   | See the checks below and the [versioned before/after captures](../../visual-baselines/showcase-excellence-v2/README.md).                                                                                                          |

The server only needs directory index support for known routes. Vanilla can also be hosted
under a subdirectory. The Markdown parser is a build dependency; the code blocks show language
and filename and copy the unmodified source. No client parser, syntax grammar, data service, or
second website is needed. Package consumers need no migration.

## Verification

- **Production and routes:** built the component packages and both production showcases. A static
  server with no SPA fallback returned HTTP 200 for 139 Vue and 137 Vanilla routes, including
  Vanilla under `/kit/`. All 128 component detail URLs loaded in Chrome. Checked 1,287 links and
  fragments between the 67 guides and compiled 73 existing documentation examples.
- **Integrated browser matrix:** 128 route, viewport and theme combinations across Vue and
  Vanilla at 360, 390, 768 and 1440 CSS pixels with reduced motion. 24 axe scans of the catalog,
  component detail, guides, workspace and search found no violations. Checked the skip link,
  keyboard and touch operation of navigation, active states, search ranking and empty state,
  Escape from a filled search field and focus restoration, direct fragments, reload, and
  back/forward. Rechecked seven representative routes per adapter at 360 pixels and 200% text.
- **Focused browser checks:** filtered the catalogs by name, purpose, and category; switched
  snippet tabs with the keyboard and compared pasted source. Checked 50 Core calendar openings,
  28 narrow overlay interactions and focus restorations, 16 form-card layouts, and 64 workspace
  axe scans with four complete workspace flows. All 124 primary fixture frames fit the narrow
  viewport horizontally. Nav Menu has room for its full menu, and the five tested viewport-height
  Vanilla layouts keep a stable height. Eight other Vue previews scroll vertically by 4–23 px on
  narrow screens; keyboard scrolling can reach the content. The guide review covered 80 real page renders
  and checked larger text on a dense guide. An independent reviewer checked screenshots, route
  semantics, search ordering and keyboard behavior; the findings were addressed before handoff.
- **Engineering:** all 678 workspace tests passed. Type checking, docs and package contracts,
  all 181 canonical accessibility cases, seven bundle budgets, consumer tree shaking, and
  packed consumer checks with npm, pnpm and Yarn passed. All 62 Vue primary snippets compiled
  and rendered through SSR, and all 62 Vanilla snippets initialized with public package imports.
  Workspace, style, HTML, tracked data and scoped Markdown lint passed. Unscoped Markdown lint
  found one MD041 in the untracked review notes; unscoped data lint flagged generated review JSON
  and an ignored local settings file. Those inputs were left unchanged.
- **Canonical visuals:** 96 captures with the pinned Chrome for Testing matched the prior local
  accepted-revision captures byte for byte. The comparison with the hosted stored PNGs still
  shows the [known local glyph drift](stored-visual-renderer.md) in 44 of 48 frames per adapter.
  All 362 paired adapter comparisons had zero differing pixels, and all 144 behavioral runs
  passed with matching motion signatures. Baselines and thresholds were not changed.

## Acceptance boundaries

Local Chrome and automated accessibility checks cover the cases listed above. No manual screen
reader, other browser engine, hosted CI, push, or publication was performed. The established Core
matrix has pre-existing accessibility findings outside the refined pages; this change does not
claim full WCAG conformance. The unrelated input gallery remains the only pre-existing untracked
material in the checkout.
