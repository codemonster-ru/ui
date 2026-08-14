# Vue and Annabel Razor consumer usage inventory

Status: Complete
Date: 2026-08-14
Roadmap item: `CMUI-175`

## Scope and baselines

This inventory separates three kinds of evidence that must not be conflated:

1. `examples/playground` is the repository-owned Vue migration consumer. It still exercises the
   remaining `vueforge-core` and `vueforge-layouts` dependencies and is the concrete removal target.
2. Annabel CMS admin is the real cross-repository Vue consumer previously approved by `CMUI-159`.
   It establishes application demand but has already removed both legacy runtime dependencies.
3. The Annabel CMS public page template is the real Annabel Razor consumer. Only server-rendered
   component tags in this surface establish current Razor demand.

| Consumer                  | Baseline                                           | Source root                                        |
| ------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Repository Vue playground | CodeMonster UI `529d338`                           | `examples/playground`                              |
| Annabel CMS Vue admin     | Annabel `b23a367e8a791f069d6c6130f41dd08cb0387d89` | `applications/annabel-cms/app`                     |
| Annabel CMS Razor page    | Annabel `b23a367e8a791f069d6c6130f41dd08cb0387d89` | `applications/annabel-cms/app/Modules/Pages/views` |

Generated files under `dist`, `public/admin/assets`, dependencies, lockfiles, tests, and package
fixtures are excluded from usage counts.

## Repository Vue migration usage

The playground declares both `@codemonster-ru/vueforge-core` and
`@codemonster-ru/vueforge-layouts`. The remaining source imports are finite and concentrated in
seven files.

| Legacy API                   | Source evidence                                                              | Required outcome                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VfAppShell`                 | `src/App.vue`                                                                | Replace with semantic application landmarks and CodeMonster UI layout primitives; keep shell state application-owned under `CMUI-188`.                |
| `VfMenuBar`, `VfNavMenuItem` | `src/App.vue`                                                                | Re-evaluate the portable menubar behavior only under `CMUI-185`; the showcase can use simpler application navigation if the behavior is not approved. |
| `VfThemeSwitch`              | `src/App.vue`                                                                | Publish and consume the application-owned theme preference recipe tracked by `CMUI-187`.                                                              |
| `VfThemeProvider`            | `src/App.vue`, `src/PlaygroundShowcase.vue`                                  | Move theme attribute ownership to application bootstrap as part of the same `CMUI-187` recipe.                                                        |
| `VfSkeletonGate`             | `src/PlaygroundShowcase.vue`, `src/sections/codeblock/CodeBlockShowcase.vue` | Compose `CmSkeleton` and busy content using the recipe tracked by `CMUI-187`; measured-height preservation remains application-owned.                 |
| `VfTag`                      | `src/sections/colors/ColorSystemShowcase.vue`                                | Use `CmBadge` unless `CMUI-184` approves a distinct outlined Tag contract.                                                                            |
| `vfSemanticColorTokenNames`  | `src/sections/colors/ColorSystemShowcase.vue`                                | Replace with `cmSemanticColorTokenNames` from `ui-tokens`.                                                                                            |
| `useTheme`                   | `src/sections/codeblock/CodeBlockShowcase.vue`                               | Read the application-owned resolved theme through the `CMUI-187` recipe.                                                                              |
| `VueForgeLayouts` plugin     | `src/main.ts`                                                                | Remove after theme bootstrap no longer comes from the layouts package.                                                                                |
| `vueforge-core/styles.css`   | `src/main.ts` and two Vite demo fixtures                                     | Remove after legacy selectors and variables are migrated to the already imported CodeMonster UI CSS.                                                  |

The remaining styling dependency is broader than the import list: nine source files contain 107
references to `--vf-*` variables or legacy `vf-*` selectors. This is migration work, not evidence
for new cross-platform components. It belongs with the affected showcase and recipe updates in
`CMUI-183`, `CMUI-187`, and `CMUI-189`.

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
- the application-owned menu and navigation wrappers are demand to evaluate during `CMUI-180` and
  `CMUI-185`, but they do not establish matching Razor demand.

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

| Demand                                         | Evidence                                              | Backlog consequence                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Remove playground legacy runtime and CSS       | Repository Vue playground                             | Required for `CMUI-189`; schedule its theme and skeleton recipes before migration.                          |
| Mature table pagination and column controls    | Annabel Vue admin compositions                        | Delivered in `CMUI-181`; fetching, rich rendering, and advanced grid policy remain application-owned.        |
| Publish application composition recipes        | Both Vue consumers own shell/theme/layout composition | Prioritize `CMUI-187` and retain the ownership boundary in `CMUI-188`.                                      |
| Preserve Container, Stack, and Card parity     | Real Annabel Razor page                               | Treat regressions as blockers; no expansion is required.                                                    |
| Add Menubar or another behavior-rich component | Playground-only Vue usage, no current Razor usage     | Keep behind the two-platform demand rule in `CMUI-185`.                                                     |
| Add a distinct Tag component                   | Color showcase only                                   | Prefer migration to Badge unless `CMUI-184` finds product demand beyond the showcase.                       |

## Reproduction

Repository usage was collected with `rg` over `examples/playground/src` and its package manifest.
The Annabel baseline was inspected with `git grep` at the exact commit above, restricted to
`applications/annabel-cms/app` and excluding generated public assets. Re-running the external
inventory requires a local Annabel checkout; normal CodeMonster UI checks intentionally do not
depend on a sibling repository.
