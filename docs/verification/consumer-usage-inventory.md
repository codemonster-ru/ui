# Vue and Annabel Razor consumer usage inventory

Status: Complete
Date: 2026-08-14
Last verified: 2026-08-15
Roadmap item: `CMUI-175`

## Scope and baselines

This inventory separates three kinds of evidence that must not be conflated:

1. `examples/vue` is the repository-owned Vue migration consumer. `CMUI-189` removed its
   direct `vueforge-core` and `vueforge-layouts` dependencies after the approved replacements and
   recipes landed.
2. Annabel CMS admin is the real cross-repository Vue consumer previously approved by `CMUI-159`.
   It establishes application demand but has already removed both legacy runtime dependencies.
3. The Annabel CMS public page template is the real Annabel Razor consumer. Only server-rendered
   component tags in this surface establish current Razor demand.

| Consumer                  | Baseline                                           | Source root                                        |
| ------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Repository Vue playground | CodeMonster UI `529d338`                           | `examples/vue`                              |
| Annabel CMS Vue admin     | Annabel `f037701378fc92ec311f29f30f7130711f3471a7` | `applications/annabel-cms/app`                     |
| Annabel CMS Razor page    | Annabel `f037701378fc92ec311f29f30f7130711f3471a7` | `applications/annabel-cms/app/Modules/Pages/views` |

Generated files under `dist`, `public/admin/assets`, dependencies, lockfiles, tests, and package
fixtures are excluded from usage counts.

## Repository Vue migration usage

The original playground dependency and source inventory was finite and concentrated in seven
files. `CMUI-189` completed every row below; they remain recorded as migration evidence.

| Legacy API                   | Source evidence                                                              | Required outcome                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VfAppShell`                 | `src/App.vue`                                                                | Replaced by native `header`/`nav`/`main`, CodeMonster UI primitives, and application-owned shell CSS/state.        |
| `VfMenuBar`, `VfNavMenuItem` | `src/App.vue`                                                                | Replaced by native links, `aria-current`, `CmInline`, and application-owned History API state.                     |
| `VfThemeSwitch`              | `src/App.vue`, `src/app-shell.ts`, `src/theme-bootstrap.ts`                  | Replaced by `CmButton` plus early application bootstrap and explicit light/dark persistence.                       |
| `VfThemeProvider`            | `src/App.vue`, `src/PlaygroundShowcase.vue`                                  | Removed; the application now owns `data-cm-theme` and mirrors `data-vf-theme` only for retained products.          |
| `VfSkeletonGate`             | `src/PlaygroundShowcase.vue`, `src/sections/codeblock/CodeBlockShowcase.vue` | Replaced by the maintained `CmSkeleton` busy-region recipe; measured-height lifecycle was not retained.            |
| `VfTag`                      | Removed from `src/sections/colors/ColorSystemShowcase.vue` in `CMUI-184`     | Superseded by `CmBadge`; the showcase-only outlined treatment did not justify a distinct cross-platform component. |
| `vfSemanticColorTokenNames`  | `src/sections/colors/ColorSystemShowcase.vue`                                | Replaced by `cmSemanticColorTokenNames` and canonical `--cm-*` tokens.                                             |
| `useTheme`                   | `src/sections/codeblock/CodeBlockShowcase.vue`                               | Replaced by observation of the application-owned `data-cm-theme` root attribute.                                   |
| `VueForgeLayouts` plugin     | `src/main.ts`                                                                | Removed; Vue mounts without a legacy design-system plugin.                                                         |
| `vueforge-core/styles.css`   | `src/main.ts` and two Vite demo fixtures                                     | Removed in favor of CodeMonster UI tokens, breakpoints, and complete shared CSS.                                   |

The `CMUI-189` exit gate now rejects direct core/layout dependencies, migrated VueForge APIs, and
legacy design-system token references in playground source. Remaining `.vf-codeblock`,
`.vf-playground`, `--vf-codeblock-*`, and `data-vf-theme` hooks belong only to the explicitly
retained CodeBlock, Playground, and Icons products.

Retained VueForge Icons, CodeBlock, and Playground imports are outside the design-system removal
target established by the roadmap.

## Real Vue application demand

At the Annabel baseline, the CMS application contains no `vueforge-core` or `vueforge-layouts`
dependency or source import. Its Vue admin imports 14 stable CodeMonster UI components across 25
source files:

`CmAlert`, `CmAvatar`, `CmButton`, `CmCard`, `CmCheckbox`, `CmContainer`, `CmDialog`, `CmDivider`,
`CmField`, `CmInput`, `CmLink`, `CmSwitch`, `CmTable`, and `CmTextarea`.

The application also owns explicit `App*` compositions for admin, auth, and setup layouts; confirm
dialogs; data tables and column selection; dropdowns and menus; fields and form layouts; group
boxes and panels; icon buttons; navigation; page headers; progress; tabs; and theme preference.
These wrappers are evidence for recipes and capability gaps, not automatic candidates for new
shared components. In particular:

- data-table pagination and column selection are real application demand for `CMUI-181`;
- Annabel's rich data cells contain actions, links, statuses, formatted dates, checkboxes, and form
  controls, so they remain an application-owned `CmTable` composition rather than entering the
  scalar `CmDataTable` contract;
- no representative consumer requires row expansion, multi-sort, interactive reorder/resize/pin,
  or DataTable-specific skeleton rows;
- auth, setup, admin shell, form-layout, group-box, panel, page-header, and theme compositions are
  real recipe demand for `CMUI-187` and application-ownership evidence for `CMUI-188`;
- menu and tab wrapper demand informed the owned-semantic content contracts completed in `CMUI-179`;
  routing, authorization, active location, and navigation-tree disclosure remain application-owned.

## Real Annabel Razor demand

The current server-rendered CMS page uses one instance each of:

- `<cm-container>` for the page landmark and width;
- `<cm-stack>` for vertical flow;
- `<cm-card>` for the article surface and title.

It also consumes the published token and complete CSS assets. The current Razor surface does not
use form, navigation, overlay, data-table, advanced-input, theme-control, or shell components.
Therefore the existing three adapters are validated by a real template, while no new portable
component can claim real Razor demand from this baseline.

## Demand signal for the maturity backlog

| Demand                                         | Evidence                                              | Backlog consequence                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Remove playground legacy runtime and CSS       | Repository Vue playground                             | Delivered in `CMUI-189`; a machine gate prevents direct core/layout or migrated API regression.       |
| Mature table pagination and column controls    | Annabel Vue admin compositions                        | Delivered in `CMUI-181`; fetching, rich rendering, and advanced grid policy remain application-owned. |
| Publish application composition recipes        | Both Vue consumers own shell/theme/layout composition | Prioritize `CMUI-187` and retain the ownership boundary in `CMUI-188`.                                |
| Preserve Container, Stack, and Card parity     | Real Annabel Razor page                               | Treat regressions as blockers; no expansion is required.                                              |
| Add Menubar or another behavior-rich component | Playground-only Vue usage, no current Razor usage     | No shared component; migrate to native flat navigation or an application-owned navigation tree.       |
| Add a distinct Tag component                   | Color showcase only                                   | Superseded by `CmBadge`; migrate `warn` to `warning` and keep no separate Tag contract.               |

## CMUI-185 manual migration outcomes

The behavior-rich candidate review found no matching Razor demand and no portable component whose
state could be separated from the owning application. The five frozen APIs therefore retain
manual migration with these final boundaries:

- `VfDataTableColumnChooser` becomes an application-owned Checkbox, Popover, or Dialog composition.
  Keep required-column policy and preference persistence in the application, then pass the ordered
  result to `CmDataTable.visibleColumnKeys`.
- `VfMenuBar` becomes ordinary flat navigation built from native links or buttons and `CmInline`.
  The playground owns its current section and history updates; ARIA menubar behavior is not
  appropriate for this site-navigation use case.
- `VfNavMenu` becomes an application-owned tree of native `nav`, nested lists, links, and disclosure
  buttons. Routing, authorization, active location, compact/collapsed presentation, and responsive
  state do not move into `CmMenu`, which remains an application action menu.
- `VfStepper` becomes a native ordered-list recipe. Use `aria-current="step"` for the current item
  and add links or buttons only when the workflow permits navigation; use a `nav` landmark only for
  that navigable form. Completion, branching, validation, routing, and focus after navigation
  remain application-owned.
- `VfTableOfContents` becomes native labelled navigation with nested lists and links, optionally
  styled with `CmLink` and layout primitives. The application supplies `aria-current="location"`.
  Native fragment navigation is the fallback; heading discovery, active-section observation,
  history, smooth scrolling, and sticky offsets remain document-application policy.

## CMUI-182 layout verification

The Phase 17 layout review found no missing primitive capability and did not broaden shell
ownership. The same finite semantic and layout contracts remain appropriate across the verified
consumers:

| Consumer                  | Verified use                                                                                                                | Outcome                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Repository Vue playground | Container, Stack, Inline, Section, and Grid compose the component and layout showcases                                      | All five primitives are exercised; the application still owns navigation, history, theme bootstrap, and shell CSS |
| Annabel CMS Vue admin     | Container participates in the application-owned auth layout; other admin, auth, and setup shells remain `App*` compositions | No shared shell API is justified by the Vue composition                                                           |
| Annabel CMS Razor page    | Container owns the `main` width and Stack owns vertical flow around the article card                                        | Real server-rendered demand verifies the primitive contract without creating Razor shell demand                   |

The playground's legacy shell and bootstrap dependencies were removed in `CMUI-189` after recipes
and ownership were settled by `CMUI-187` and `CMUI-188`. Retained VueForge products remain
side-by-side dependencies and do not create a layout-primitive gap.

## Stable 1.1 consumer confirmation

Annabel commit `f037701378fc92ec311f29f30f7130711f3471a7` preserves the demand inventory above while
moving the representative application to the public stable cohort. Its npm manifest and lock file
pin tokens `1.0.1`, CSS `1.1.0`, and Vue `1.1.0` to `registry.npmjs.org`; both Composer manifests
require `codemonster-ru/ui-razor:^1.1.0` from Packagist. The application retains only
`@codemonster-ru/vueforge-icons` from the explicitly retained VueForge products and has no direct
`vueforge-core` or `vueforge-layouts` dependency.

The CMS CI matrix passed on PHP 8.2, 8.3, and 8.4. Each job completed the Admin Vite production
build, 68 tests with 182 assertions, PHPStan, npm and Composer audits, and publication of all 47
packaged UI assets; the release rehearsal separately passed the Setup production build. The
independent registry gates additionally verified five exact npm releases across 41 signed installed
packages with 27 attestations, plus the Composer package's 37 component registrations, rendering,
and archive provenance. See the
[CodeMonster UI 1.1 registry validation](./codemonster-ui-1.1-registry-validation.md) for exact
release evidence and reproduction commands.

## Reproduction

Repository usage was collected with `rg` over `examples/vue/src` and its package manifest.
The Annabel baseline was inspected with `git grep` at the exact commit above, restricted to
`applications/annabel-cms/app` and excluding generated public assets. Re-running the external
inventory requires a local Annabel checkout; normal CodeMonster UI checks intentionally do not
depend on a sibling repository.
