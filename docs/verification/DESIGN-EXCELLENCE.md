# Design excellence: showcase and documentation

The starting revision is `63a6fb2d`. Its [product quality record](product-quality.md) and
[historical restoration acceptance](historical-restoration.md) describe the existing package
and visual contracts. This increment changes the private Vue and standalone Vanilla showcases
and developer guides. The published runtime, adapters, shared CSS, and tokens remain the
reference for the examples.

## Findings and implementation register

| Priority | Category                | Before                                                                                                                                                 | Change and evidence                                                                                                                                                                 |
| -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Showcase usability      | On mobile, Vue's scrollable top navigation clipped route links. Core opened on theme controls without a route to find a specific component.            | Align the two headers and wrap the route links; add a Core entry point and section shortcuts. Verify visible, keyboard reachable links and direct URLs.                             |
| P1       | Documentation usability | The component inventory, guides, and working examples were spread across grouped showcases and repository files.                                       | Add searchable component URLs with contract previews, API and usage links, plus a developer index organized by component.                                                           |
| P1       | Documentation accuracy  | A new user had to assemble the Vanilla quick start from separate markup and runtime examples. Installation and packed use had different prerequisites. | Provide executable quick starts, direct guides, and explicit built archive, TypeScript, SSR, and enhancement lifecycle instructions. Validate examples against the current exports. |
| P2       | Accessibility           | A keyboard user had to pass the top navigation each time. Typography specimens competed with page headings.                                            | Add a skip link to the main landmark, add page titles, and keep demonstration glyphs out of the document outline. Check keyboard focus and target sizes.                            |
| P2       | Visual consistency      | The headers used different mobile navigation behaviors and their content did not align with the demos on a wide screen.                                | Use one responsive, token-based shell and page metadata. Use explicit current-page and theme-control states and reflow on smaller screens.                                          |
| P2       | Showcase usability      | Individual examples illustrated API coverage but did not show how an application could combine them.                                                   | Add a release workspace on both adapters with tabs, a dashboard, a searchable filtered table, a release form, settings, and sample sign-in.                                         |
| P3       | Optional aesthetics     | Changing global typography, geometry, colors, or motion would affect the accepted rendering across unrelated applications.                             | Keep those tokens and published styles stable. Revisit only with a demonstrated component defect or a separately reviewed design proposal.                                          |

No critical usability defect was reproduced in the route baseline. The initial Chrome audit
covered 60 views across both adapters, both themes, and 360, 768, and 1,440 CSS pixels. None had
document-wide horizontal overflow or script errors. Vue's top navigation clipped links in all
12 mobile views. Inspection also covered the existing component contracts and their state
matrices. The paired fixture checks below exercise shared rendering separately from page layout.

The navigation uses short labels, a visible current page, and labeled landmarks in line with
[USWDS header guidance](https://designsystem.digital.gov/components/header/). The keyboard review
checks the skip link, focus after following it, and reflow against the relevant
[W3C focus and target size criteria](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
These checks are limited to the tested interactions.

## Delivered

- **Showcase:** Core introduces the library and links to the visual matrices, Reference, and
  Examples. The shared header wraps on phones, indicates the current route, and controls color
  mode. Core still offers system mode. Colors, Layouts, Icons, and the Vue-specific CodeBlock
  and Playground routes remain available.
- **Reference:** Each showcase has 62 component detail routes and two entries for compositions.
  The component pages use the existing fixtures for previews and variants. They show copyable
  Vue and Vanilla examples, contract API details, and direct guide links. Theme Provider and
  Confirm Dialog link to their integration recipes and existing examples.
- **Application examples:** The release workspace composes tabs, buttons, filters, a compact table,
  form controls and validation, status feedback, workspace settings, and sample sign-in. The demo
  state is local to the page. There is no account or network integration.
- **Developer documentation:** [Start here](../getting-started.md), then use the
  [component index](../components/index.md), [integration guide](../integration.md), and
  [design tokens guide](../tokens/getting-started.md). The guides distinguish the stable release
  from the local 2.0 package cohort and cover TypeScript, SSR, forms, overlays, and Vue and Vanilla
  lifecycle ownership.
- **Consistency:** Both showcases use the same shell styles and page names. The Core matrices
  use clearer headings, a labeled Avatar, and progress feedback outside a fill that can be too
  narrow for text. The Vanilla Core Card uses the shared Button styling for its action. The
  typography overflow specimen can receive keyboard focus. None of these corrections change the
  published components or the historical fixture inputs.

## Verification

| Gate                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render and reflow               | Chrome 157 rendered 108 production views across both themes and 360, 768, and 1,440 CSS pixels. No clipped header links, document-wide overflow, unnamed frames, or console errors were observed. The [v1 snapshot set](../../visual-baselines/showcase-excellence-v1/README.md) is a separate, versioned baseline.                                                                                                                                                                                                                   |
| Component reference             | All 128 detail URLs loaded. Search and empty results, trusted keyboard Copy, DatePicker calendar and time controls, and Escape/focus restoration for Dialog passed on both adapters. An independent check compiled and SSR-rendered all 62 primary Vue snippets and initialized all 62 Vanilla snippets against public entries.                                                                                                                                                                                                       |
| Application examples            | 64 Chrome layout and axe checks covered all four workspace views at 320, 360, 768, and 1,280 pixels in both themes and adapters. The full filter, validation, release creation, preferences, and sample sign-in flows passed at mobile and desktop widths. All four tabs stayed visible and at least 44 pixels high at the tested widths.                                                                                                                                                                                             |
| Accessibility                   | 32 top-level axe scans at 320 and 1,440 pixels found no violations on the checked new pages. The baseline comparison confirmed that remaining Core findings predate this work. Trusted keyboard checks covered skip-link focus, section jumps, direct hash links and persisted theme. The contract suite also passed all 181 canonical accessibility cases.                                                                                                                                                                           |
| Historical visuals and behavior | 362 Vue/Vanilla pixel pairs matched and all 144 behavioral runs passed with equal motion signatures. All 96 canonical captures matched the equivalent local accepted captures at threshold zero. The strict stored comparison still reports the [known local glyph residual](stored-visual-renderer.md) in 44 of 48 frames per adapter. The approved snapshots and thresholds are unchanged.                                                                                                                                          |
| Engineering and distribution    | Full lint in a clean source copy, cold workspace tests, types, formatting, documentation checks (including 73 compiled example fixtures), package contracts, production builds, clean install, and all seven package dry runs passed. Packed consumer checks passed with npm, pnpm, and Yarn. All seven package budgets passed; runtime was 79.98/80 KiB, and the tree-shaking gates stayed within 59.98/60 KiB for the Vue namespace and 80.58/81 KiB for its historical namespace. These sizes use the official Node 24.19.0 build. |
| Independent review              | A second agent reviewed mobile and desktop before/after images and the reference and shell code, checked guide targets, and tested the snippets. Follow-up review verified the repaired mobile tab layout and the complete DatePicker preview.                                                                                                                                                                                                                                                                                        |

## Remaining work and acceptance

The showcase and documentation increment is locally verified within the scope above. The
broader product release remains pending. Hosted CI was not run on this candidate; there was no
push or publication. The production dependency audit found zero advisories, and the development
dependency audit reported low and moderate advisories below the repository's high-severity gate.

Some existing Core matrices still expose duplicate landmark names, scrollable table regions
without focus targets, and compact clear/password controls below the automated target-size
threshold. Those issues need focused changes against the accepted component contract and should
be tracked separately. Automated checks do not establish screen reader behavior or full WCAG
conformance. Non-Chromium and manual assistive-technology testing are still outstanding.

No package migration is needed. Vue production hosting must continue to rewrite showcase routes
to the application entry; Vanilla detail pages are directory indexes. GitHub guide links track the
project's `main` branch and will show repository documentation added here after the revision is
published.
