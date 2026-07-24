# VueForge: Phase 2 implementation report

Prepared on: 2026-07-22. Status: **Phase 2 is complete; the target color architecture, component migration,
contract checks, and visual regression are complete**.

Historical values are taken from the Phase 0/1 audit documents, while final values come from the current canonical schema.
Phase 0 and Phase 1 are not retroactively rewritten.

## 1. Phase 2 goals and scope

Phase 2 intentionally changes the visual color treatment of VueForge: it introduces the target OKLCH palette, separates
light/dark semantic materials, fixes confirmed contrast failures, and migrates built-in component mappings to semantic roles.

The scope includes:

- seven perceptually tuned primitive scales;
- independent surface, link, selected, hover, and active materials;
- a WCAG 2.2 contrast matrix limited to supported semantic pairings;
- semantic-first component mappings with a VueForge 1.x fallback;
- state precedence for disabled, invalid, selected/checked, hover/active, focus-visible, and read-only;
- custom, coordinated light/dark Shiki themes for CodeBlock;
- a Playground theme bridge for semantic CSS variable dependencies;
- a color-system showcase and reproducible desktop/mobile/CVD smoke script;
- a regression policy for primitive usage and hardcoded colors.

Out of scope are geometry, spacing, typography, DOM redesign, removal of legacy tokens, and other VueForge 2 breaking
changes. Phase 2 does not copy another UI library's palette or add a separate `accent` without a product use case.

## 2. Palette before and after

```text
Phase 1
component CSS ───────────────→ legacy/component aliases ─→ 29 sparse HEX primitives
77 semantic roles ───────────→ legacy color roots ────────┘

Phase 2
component CSS → existing component customization token → 85 semantic roles → 66 OKLCH primitives
                                                      └→ VueForge 1.x legacy fallback
```

| Contract                        |    Before: Phase 1 |     After: Phase 2 |
| ------------------------------- | -----------------: | -----------------: |
| Primitive tokens                |             **29** |             **66** |
| Semantic roles                  |             **77** |             **85** |
| Additive semantic keys          |             **76** |             **84** |
| Preserved legacy keys           |            **847** |            **847** |
| Complete built-in preset        |            **952** |            **997** |
| Root dark overrides             |             **53** |            **137** |
| Canonical alias depth limit     |              **4** |              **5** |
| Custom-prefix alias depth limit |              **9** |             **11** |
| Authoring format                | Existing-value HEX | In-gamut `oklch()` |

`colorFocusRing` remains the only intersection of the legacy and semantic sets. Therefore, the final preset contains
`847 + 66 + 84 = 997` unique keys. All 847 VueForge 1.x keys are preserved; the change from `952 → 997` consists of
37 new primitive stops and eight new semantic roles.

## 3. Primitive values before and after

### Phase 1 baseline

| Family  | Baseline material values                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neutral | `0 #fff`, `50 #f6f8fb`, `100 #f3f3f3`, `200 #d9dde3`, `250 #d7d7d7`, `300 #d4d4d4`, `400 #9da0a6`, `500 #616773`, `600 #363b46`, `700 #272b33`, `750 #252526`, `800 #20232a`, `850 #1f232b`, `900 #17191e`, `950 #111827`, `1000 #000` |
| Primary | `500 #276cb5`, `600 #0e639c`                                                                                                                                                                                                           |
| Success | `500 #2e7d32`, `600 #37783e`                                                                                                                                                                                                           |
| Info    | `500 #0077a3`, `600 #1a739f`                                                                                                                                                                                                           |
| Warning | `400 #b79a63`, `500 #a1841f`, `950 #1f1300`                                                                                                                                                                                            |
| Danger  | `500 #bf3f3f`, `600 #c72e39`                                                                                                                                                                                                           |
| Help    | `500 #7b4c96`, `600 #6e43a2`                                                                                                                                                                                                           |

These 29 materials preserved the original rendered output but did not form complete state scales. The same chromatic
material was often used both as a solid background and as a foreground.

### Phase 2 neutral scale

Neutral uses hue `260` and low chroma. The endpoint stops are not absolute white/black; the surface hierarchy is built
with lightness rather than an incidental blue cast.

| Step | OKLCH                    | Purpose                              |
| ---: | ------------------------ | ------------------------------------ |
|    0 | `oklch(99.5% 0.002 260)` | light surface and light on-solid     |
|   50 | `oklch(97.8% 0.005 260)` | light canvas                         |
|  100 | `oklch(95.8% 0.007 260)` | light subtle/hover/disabled          |
|  200 | `oklch(90% 0.012 260)`   | light divider; dark primary text     |
|  250 | `oklch(84% 0.016 260)`   | light default border                 |
|  300 | `oklch(74.5% 0.020 260)` | dark secondary text                  |
|  400 | `oklch(65% 0.026 260)`   | light interactive border; dark muted |
|  500 | `oklch(55% 0.032 260)`   | light muted; dark interactive border |
|  600 | `oklch(48.8% 0.030 260)` | light secondary; dark default border |
|  700 | `oklch(40.5% 0.025 260)` | dark subtle border/divider           |
|  750 | `oklch(33% 0.020 260)`   | dark elevated/active surface         |
|  800 | `oklch(29% 0.018 260)`   | dark subtle/hover surface            |
|  850 | `oklch(25.6% 0.014 260)` | light primary text; dark surface     |
|  900 | `oklch(21.4% 0.010 260)` | dark canvas                          |
|  950 | `oklch(16.5% 0.008 260)` | dark on-bright/inverse text          |
| 1000 | `oklch(11.5% 0.006 260)` | backdrop/shadow material             |

### Phase 2 chromatic scales

Chroma is manually increased toward useful middle stops and reduced at the endpoints. The scales are mode-independent;
light/dark semantic maps select different stops, so the dark theme is not a mechanical inversion of the light theme.

| Family  | Hue | Steps: `lightness/chroma`                                                                                                                         |
| ------- | --: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary | 247 | `100 95.5/.020`, `200 89/.050`, `300 76/.110`, `400 65/.140`, `500 55.7/.144`, `600 50/.130`, `700 45/.115`, `800 38.5/.090`, `900 30.5/.055`     |
| Success | 148 | `100 95.5/.020`, `300 79/.125`, `400 68/.145`, `500 59/.135`, `600 51.5/.115`, `700 45.5/.105`, `800 38.5/.080`, `900 30.5/.040`                  |
| Info    | 230 | `100 95.5/.018`, `300 78.5/.105`, `400 68/.130`, `500 60/.118`, `600 52.5/.103`, `700 46.5/.091`, `800 39.5/.075`, `900 30.5/.038`                |
| Warning |  88 | `100 96/.035`, `300 81.5/.115`, `400 76/.130`, `500 68.5/.125`, `600 61.5/.115`, `700 54/.105`, `800 47.5/.095`, `900 31.5/.035`, `950 21.5/.043` |
| Danger  |  20 | `100 95.5/.020`, `300 76/.142`, `400 66.5/.180`, `500 60.5/.180`, `600 53.5/.170`, `700 47.5/.150`, `800 40.5/.120`, `900 30/.050`                |
| Help    | 307 | `100 95.5/.020`, `300 77/.115`, `400 67/.145`, `500 60/.150`, `600 52/.130`, `700 44.5/.115`, `800 38/.090`, `900 29.5/.045`                      |

`help` remains a separate violet family: it is an existing public tone for actions, feedback, and progress. All 66
authored values are within the sRGB gamut, protecting contrast calculations from browser gamut mapping.

## 4. Semantic values before and after

In Phase 1, most roles were aliases to 36 legacy color sources; hover/active/selected were partially calculated through
multi-source `color-mix`. In Phase 2, light and dark receive complete, independent 85-role maps.

Eight new roles:

- `colorBackgroundSurfaceSelectedHover`;
- `colorBackgroundSurfaceSelectedActive`;
- `colorBackgroundInverseHover`;
- `colorBackgroundInverseActive`;
- `colorTextLink`;
- `colorTextLinkHover`;
- `colorTextLinkActive`;
- `colorInteractivePrimarySubtleForeground`.

| Role group                       | Phase 1                              | Phase 2 light      | Phase 2 dark       |
| -------------------------------- | ------------------------------------ | ------------------ | ------------------ |
| canvas / surface / subtle        | existing N50 / N0 / N100             | N50 / N0 / N100    | N900 / N850 / N800 |
| elevated                         | surface alias                        | N0                 | N750               |
| hover / active                   | text mix `6% / 10%`                  | N100 / N200        | N800 / N750        |
| selected / hover / active        | primary mix `20%`; no compound roles | P100 / P200 / P300 | P900 / P800 / P700 |
| inverse / hover / active         | legacy contrast; no compound roles   | N850 / N800 / N750 | N200 / N300 / N400 |
| text primary / secondary / muted | legacy text/muted aliases            | N850 / N600 / N500 | N200 / N300 / N400 |
| disabled / placeholder           | both inherited muted                 | N400 / N500        | N500 / N400        |
| link default / hover / active    | overloaded primary                   | P700 / P800 / P900 | P300 / P200 / P400 |
| border subtle / default          | one legacy border                    | N200 / N250        | N700 / N600        |
| border strong / interactive      | one legacy border                    | N400 / N400        | N500 / N500        |
| focus border / ring              | weak primary mixes                   | P600 / P600        | P300 / P300        |
| primary solid / hover / active   | one base material                    | P600 / P700 / P800 | P500 / P600 / P700 |
| primary subtle bg / fg           | soft mix / primary                   | P100 / P700        | P900 / P300        |

Status roles remain eight independent decisions for each of success, warning, danger, info, and help:

| Status material          | Phase 1            | Phase 2 light                | Phase 2 dark       |
| ------------------------ | ------------------ | ---------------------------- | ------------------ |
| solid                    | legacy base        | 600; warning 400             | 500                |
| on-solid                 | legacy contrast    | N0; warning N950             | N950; warning N950 |
| hover / active           | same base material | 700 / 800; warning 500 / 600 | 400 / 300          |
| subtle background        | 12% color mix      | 100                          | 900                |
| subtle foreground / icon | overloaded base    | 700; warning 800             | 300                |
| border                   | soft mix           | 500; warning 700             | 400                |

Opaque interactive materials produce the same result on canvas, surface, and elevated containers. Transparency is
preserved only for compositional backdrop/shadow scenarios.

## 5. Contrast before and after

The baseline uses historical computed sRGB ratios. Final ratios are calculated from canonical OKLCH values with the same
WCAG 2.2 luminance formula used by the regression test.

| Pairing                                        |                                Before light / dark | After light / dark | Minimum |
| ---------------------------------------------- | -------------------------------------------------: | -----------------: | ------: |
| Primary text / surface                         |                                    `15.75 / 10.61` |    `15.50 / 11.67` |     4.5 |
| Muted text / canvas                            |                                      `5.34 / 6.71` |      `4.55 / 5.43` |     4.5 |
| Primary/link foreground / surface              |                                      `6.40 / 2.92` |      `7.30 / 7.39` |     4.5 |
| Danger foreground / surface                    |                                      `5.41 / 2.99` |      `7.13 / 6.89` |     4.5 |
| Help foreground / surface                      |                                      `7.03 / 2.48` |      `7.91 / 7.29` |     4.5 |
| Warning foreground / surface                   |                                      `3.60 / 5.85` |      `6.62 / 8.83` |     4.5 |
| Interactive control border / surface           |                                      `1.36 / 1.40` |      `3.19 / 3.24` |     3.0 |
| Focus ring / surface                           |                                      `1.65 / 1.52` |      `5.89 / 7.39` |     3.0 |
| Selected foreground / strongest selected state |                                      `4.73 / 2.42` |      `4.59 / 5.35` |     4.5 |
| Status subtle foreground / background, minimum |                                      `3.16 / 2.27` |      `5.98 / 6.10` |     4.5 |
| Status border / subtle background, minimum     | previous soft-border recipes did not guarantee 3:1 |      `3.38 / 4.19` |     3.0 |
| CodeBlock syntax foreground, minimum           |                                      `3.15 / 2.95` |      `5.59 / 6.18` |     4.5 |

The supported matrix also checks primary/on-solid, inverse, placeholder, links, status solid/hover/active, meaningful
icons, borders, and progress materials. This is a finite list of real pairings, not a meaningless Cartesian product.

## 6. Fixed WCAG violations

The following issues are fixed at the built-in semantic contract level:

- focus ring and focus border, which previously failed to reach 3:1;
- interactive boundaries Input/Select/Checkbox/Radio/Switch;
- dark primary/link, danger, and help foregrounds;
- light warning foreground;
- status foreground/icon/border on subtle surfaces;
- dark selected/current foreground and separate selected + hover/active states;
- CodeBlock syntax tokens, editor background pairing, selection, and copy-button focus;
- secondary, muted, and placeholder pairings without repeated subtree opacity;
- primary/status solids and their independently authored on-solid foregrounds;
- invalid + checked/open/focus precedence, under which the danger boundary no longer disappears.

Disabled roles intentionally do not reach active-text levels: unavailable controls are excluded from the relevant WCAG
criteria, but receive explicit fg/bg/border/cursor materials and are no longer weakened by repeated opacity where CSS
has been migrated.

## 7. Intentional exceptions and CVD/non-color cues

The color matrix guarantees luminance contrast but does not prove that meaning is conveyed without hue. The showcase
documents existing non-color cues: Alert icons, Checkbox/Radio marks, selected indicator/position/weight, and focus
geometry. The visual script prepares separate protanopia, deuteranopia, tritanopia, and achromatopsia captures for both
themes. All eight CVD captures were reviewed manually. Alert/status labels and icons, control marks, focus geometry, and
selected position/weight retain a readable structure in both themes. Under achromatopsia, chromatic materials naturally
lose hue distinction, but the built-in showcase scenarios do not rely on it alone. The API exceptions listed below
remain intentional limitations.

The following product/API exceptions intentionally remain:

- `Alert` can lose its second signal when `hideIcon` is used; the consumer must retain a clear title/text;
- the `Badge` and `Tag` tone does not add an icon automatically;
- the `ProgressBar` and `ProgressSpinner` tone still requires external label/context semantics;
- a selected option in `VfSelect` has ARIA/state semantics, but within the open list it is visually distinguished mainly
  by the selected material color;
- an invalid control without a supporting message/icon may communicate the error only through the boundary hue;
- custom content can remove the built-in shape/label cues;
- disabled content has intentionally lower contrast and must also be identifiable through cursor/behavior/ARIA semantics.

Phase 2 does not change component props or the DOM to insert cues automatically: that would be a separate public API
decision. No syntax role requires a reduced text-contrast exception: package fallbacks are designed for at least 4.5:1.

## 8. Migrated components and states

Built-in component-token defaults are now semantic-first, while CSS retains a legacy/component fallback. The migration covers:

| Group         | Components/areas                                                                                         | Main changes                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Foundations   | root, prose, inline code, text utilities, HorizontalScroller, Divider                                    | canvas/text/link/divider/focus roles                                      |
| Actions       | Button, IconButton, Link                                                                                 | independent solid hover/active, 3:1 secondary boundary, disabled/focus    |
| Forms         | Field, Fieldset, Input, Textarea, Select, Checkbox, Radio, Switch                                        | 3:1 boundaries, read-only, invalid/open/checked/focus precedence          |
| Navigation    | Accordion, Breadcrumbs, Dropdown, MenuBar, NavMenu, Tabs, TableOfContents, Stepper                       | selected + hover/active roles, disabled suppression, link/indicator roles |
| Overlays      | Dialog, Drawer, CommandPalette; preset mappings for Popover/Tooltip                                      | elevated/inverse/backdrop/border/focus roles                              |
| Feedback/data | Alert, Avatar, Badge, Tag, ProgressBar, ProgressSpinner, Skeleton, Card, Panel, Table/DataTable mappings | separate status fg/bg/border/icon and surface hierarchy                   |
| Layouts       | AdminLayout/Shell, AppShell, Auth/Document/Error/Setup layouts                                           | semantic-first canvas/surface/text roots with legacy fallback             |
| Ecosystem     | CodeBlock, Playground, sandbox runtime                                                                   | scoped semantic adapters and full dependency propagation                  |

`Alert`, `DataTable`, and `Fieldset` continue to use their own component tokens where they form a real customization
boundary; their default values are now semantic. Primitive references in component CSS are prohibited.

### Compound states

New precedence model:

1. disabled suppresses hover/active and applies its own fg/bg/border roles;
2. the invalid boundary remains above checked/open, while focus adds a ring without erasing invalid;
3. selected/checked defines the base material;
4. selected + hover and selected + active use separate opaque roles;
5. regular hover/active applies only when no higher-priority state is present;
6. focus-visible is added without replacing selected/checked/open;
7. read-only uses a subtle surface, while invalid retains the danger boundary.

`VfSwitch static` remains an interactive visual variant: it retains the static track recipe, preserves hover and
focus-visible cues, and does not use disabled semantics.

Button/IconButton no longer use `brightness()` for built-in state colors. The legacy filter hooks
`--vf-button-solid-hover-filter` and `--vf-button-solid-active-filter` are preserved; their built-in default is now
`none`, so existing custom CSS can continue using the hook without restoring the filter to the standard palette.

### CodeBlock and Shiki

`github-light`/`github-dark` are no longer combined with the VueForge background. The lazy highlighter creates
package-owned `vueforge-light`/`vueforge-dark` CSS-variable themes where syntax background, foreground, comments,
strings, constants, keywords, parameters, functions, diff/ANSI roles, and selection are coordinated with the semantic
palette. The `diff` language, a copy focus outline, and a unified editor/code background were added. Standalone OKLCH
fallbacks are a documented exception to the hardcoded-color policy and are checked by a separate gamut/contrast
contract. Exact Shiki adapters are fixed for each syntax variable; default Core semantic resolutions are checked
separately against the actual neutral-subtle editor surface.

The public `--vf-codeblock-disabled-opacity` remains a working VueForge 1.x hook. Its built-in default changed from
`0.6` to `1` so that the disabled state does not reduce contrast across the entire syntax subtree; an explicit consumer
override continues to apply, while the disabled copy action is not revealed and receives no hover/focus treatment.

## 9. Legacy tokens as a compatibility layer

All **847** pre-Phase-1 keys are preserved; no legacy token was removed or renamed. Existing component-token overrides
remain the customization boundary:

```text
component CSS
  → --vf-input-border-color
  → --vf-color-border-interactive
  → var(--vf-color-border) compatibility fallback
```

Primitive and semantic fields remain optional in `VfThemeTokens`, so a complete VueForge 1.x preset continues to
type-check. Custom prefix runtime/static paths must create canonical `--vf-*` aliases, as in Phase 0/1.

Compatibility does not imply the previous fan-out behavior: for example, `colorDanger` now remains a solid
compatibility root and is not required to define subtle text, icon, border, hover, and active simultaneously. This
intentionally removes overloaded semantics; a complete custom scale requires the corresponding semantic overrides.

## 10. Changed files

The list reflects the Phase 2 working tree when this report was prepared; generated `dist`/build artifacts are excluded.

### Theme and Core color contract

- `packages/theme/src/color-token-contract.ts`
- `packages/theme/__tests__/runtime.spec.ts`
- `packages/core/src/theme/color-token-schema.ts`
- `packages/core/src/theme/color-token-schema.spec.ts`
- `packages/core/src/theme/color-contrast.spec.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`

### Core component migration and policy

- `packages/core/src/styles/components/base.css`
- `packages/core/src/styles/components/horizontal-scroller.css`
- `packages/core/src/styles/entries/breadcrumbs.css`
- `packages/core/src/styles/entries/button.css`
- `packages/core/src/styles/entries/checkbox.css`
- `packages/core/src/styles/entries/command-palette.css`
- `packages/core/src/styles/entries/dialog.css`
- `packages/core/src/styles/entries/drawer.css`
- `packages/core/src/styles/entries/dropdown.css`
- `packages/core/src/styles/entries/field.css`
- `packages/core/src/styles/entries/icon-button.css`
- `packages/core/src/styles/entries/input.css`
- `packages/core/src/styles/entries/link.css`
- `packages/core/src/styles/entries/menu-bar.css`
- `packages/core/src/styles/entries/nav-menu.css`
- `packages/core/src/styles/entries/progress-bar.css`
- `packages/core/src/styles/entries/progress-spinner.css`
- `packages/core/src/styles/entries/radio.css`
- `packages/core/src/styles/entries/select.css`
- `packages/core/src/styles/entries/stepper.css`
- `packages/core/src/styles/entries/switch.css`
- `packages/core/src/styles/entries/table-of-contents.css`
- `packages/core/src/styles/entries/tabs.css`
- `packages/core/src/styles/entries/textarea.css`
- `packages/core/src/components/stepper/VfStepper.spec.ts`
- `packages/core/src/styles/component-palette-contract.spec.ts`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/src/styles/prose-contract.spec.ts`
- `packages/core/scripts/check-css-parity.mjs`
- `packages/core/scripts/check-form-geometry.mjs`
- `packages/core/scripts/smoke-css-export.mjs`

### CodeBlock and Playground

- `packages/codeblock/src/themes/vueforge.ts`
- `packages/codeblock/src/themes/vueforge.test.ts`
- `packages/codeblock/src/services/code-highlight.ts`
- `packages/codeblock/src/tokens.css`
- `packages/codeblock/src/codeblock.css`
- `packages/codeblock/src/types.ts`
- `packages/codeblock/src/components/__tests__/VfCodeBlock.test.ts`
- `packages/playground/src/tokens.css`
- `packages/playground/src/playground.css`
- `packages/playground/src/VfPlayground.vue`
- `packages/playground/src/VfPlayground.spec.ts`
- `packages/playground-core/src/runtimes/browserRuntime.ts`
- `packages/playground-core/__tests__/browserRuntime.test.ts`

### Layouts semantic roots

- `packages/layouts/src/style-entries/admin-layout.css`
- `packages/layouts/src/style-entries/admin-shell.css`
- `packages/layouts/src/style-entries/app-shell.css`
- `packages/layouts/src/style-entries/auth-layout.css`
- `packages/layouts/src/style-entries/document-layout.css`
- `packages/layouts/src/style-entries/error-layout.css`
- `packages/layouts/src/style-entries/setup-layout.css`
- `packages/layouts/src/style-parts/shell.css`

### Showcase, visual automation, and documentation

- `examples/playground/src/App.vue`
- `examples/playground/src/sections/colors/ColorSystemShowcase.vue`
- `examples/playground/src/sections/colors/color-system-showcase.css`
- `examples/playground/vite.config.ts`
- `scripts/visual/phase-2-color-smoke.mjs`
- `package.json`
- `docs/core/guides/color-tokens.md`
- `packages/core/docs/theme-api.md`
- `docs/codeblock/components/code-block/theming.md`
- `docs/playground/components/playground/theming.md`
- `docs/design-audit/phase-2-report.md`
- `docs/design-audit/color-inventory.md` — historical banner only
- `docs/design-audit/accessibility-colors.md` — historical banner only
- `docs/design-audit/color-audit-report.md` — historical banner only
- `packages/core/docs/visual-baseline.md` — historical banner only

## 11. Public changes

Additive public contract:

- Theme/Core name tuples and derived types contain 37 new primitive names and eight semantic names;
- `VfThemeTokens` accepts new optional fields;
- the CSS contract publishes the same 997 names in runtime/static/full/foundation + component/scoped/custom-prefix paths;
- `diff` was added to `SUPPORTED_CODE_BLOCK_LANGUAGES`;
- CodeBlock receives new syntax/selection/copy-focus CSS customization variables;
- `/colors` was added only to the repository showcase, not to the library runtime API.

Component props, events, slots, DOM contracts, CSS export paths, and theme runtime signatures are unchanged. Public
constants `SHIKI_LIGHT_THEME`/`SHIKI_DARK_THEME` are preserved for source compatibility, although the built-in
highlighter now uses package-owned themes.

Intentional behavioral changes:

- the built-in palette and rendered colors change;
- built-in runtime CSS requires browser support for `oklch()` alongside the already used `color-mix()`;
- raw custom-property values may be OKLCH/aliases instead of the previous HEX/recipes;
- an overloaded legacy root no longer controls all semantic descendants automatically;
- compound selected hover/active roles take precedence over a single base component override.
- secondary Button/IconButton use a validated interactive border instead of a decorative default border;
- the neutral ProgressBar label uses the semantic inverse-text role instead of the background role;
- built-in `--vf-codeblock-disabled-opacity` is `1` instead of `0.6`; the hook remains active, and disabled copy is not revealed.

## 12. Risks for custom themes

1. **Partial root override.** Changing only `colorPrimary` or a status root no longer defines the entire scale. Semantic
   overrides are required for solid/subtle/foreground/border/hover/active.
2. **Compound states.** `tabsTabActiveBackground` and a similar 1.x component token retain the base selected fallback,
   but selected + hover/active use the new semantic roles.
3. **OKLCH support.** The built-in preset does not duplicate every runtime variable with a second sRGB declaration,
   because that would cause static/runtime/scoped/custom-prefix maps to diverge. An older browser matrix requires a
   custom sRGB preset.
4. **Custom prefix.** Handwritten CSS with a nonstandard prefix and no canonical aliases is incompatible with compiled
   component CSS; use the VueForge runtime/static builder.
5. **CodeBlock.** Third-party Shiki colors must be designed together with the actual CodeBlock background. Replacing
   individual inline token colors without the background contract recreates the previous mismatch.
6. **Filter hooks.** Existing custom Button/IconButton filters continue to apply; combining a custom filter with the new
   authored state colors requires visual revalidation.
7. **Raw-value introspection.** Code that compares strings from `getPropertyValue()` instead of the computed rendered
   color will see new OKLCH/`var()` representations.
8. **CodeBlock disabled opacity.** The built-in block no longer weakens the entire syntax subtree. If the previous visual
   dimming was part of a custom theme, set `--vf-codeblock-disabled-opacity` explicitly and recheck syntax contrast.

## 13. Migration notes

For a custom VueForge 1.x preset:

1. Preserve legacy/component overrides that form a local customization boundary.
2. Move shared decisions into semantic roles; do not use primitives directly in component CSS.
3. For primary, define solid, hover, active, subtle background/foreground, border, and selected roles independently.
4. For each status, define eight roles, especially separate solid and subtle foreground roles.
5. Configure base, selected-hover, and selected-active together for the selected recipe.
6. Check light and dark independently, including root dark/local light and root light/local dark.
7. Check the supported contrast matrix; do not treat an arbitrary foreground/background as a supported pairing.
8. For a custom CodeBlock/Shiki adapter, coordinate editor background, syntax foregrounds, selection, and focus.
9. If pre-OKLCH browser support is needed, provide custom sRGB token values through the same public theme contract.
10. Do not remove `colorWarn*` or other legacy names before VueForge 2.
11. If a custom theme relied on the previous CodeBlock disabled fade, set `--vf-codeblock-disabled-opacity: 0.6`
    explicitly; the built-in default is now `1`, and the hook itself has not been removed.

## 14. Test and build results

Final checks were performed after the working tree stabilized.

| Check                                            | Command/contract                     | Result                                                              |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------- |
| Full workspace suite                             | `npm test`                           | **PASS** — 420 Vitest tests and package smoke contracts             |
| TypeScript                                       | `npm run typecheck`                  | **PASS** in all workspaces                                          |
| ESLint, Stylelint, HTML, Markdown, data          | `npm run lint:all`                   | **PASS**, including 286 Markdown files                              |
| Library packages                                 | `npm run build`                      | **PASS** — eight library packages                                   |
| Demo/docs production build                       | `npm run build:demo`                 | **PASS**; only a Vite warning about production chunk size           |
| Clean install and complete CI-like gate          | `npm run verify`                     | **PASS**, including clean install, checks, no-dist tests, and build |
| Packed consumers and type contracts              | Core/package consumer smokes         | **PASS**                                                            |
| CSS exports/full/component-entry                 | Core CSS export/parity contracts     | **PASS**                                                            |
| Runtime/static/scoped/custom-prefix/fallback     | Theme/Core exact-map contracts       | **PASS** — the same 997 names                                       |
| Semantic contrast matrix and in-gamut primitives | `color-contrast.spec.ts`             | **PASS** — 66 primitives and 15 supported-pairing tests             |
| Hardcoded color/primitive usage policy           | `component-palette-contract.spec.ts` | **PASS**                                                            |
| CodeBlock Shiki gamut/contrast/theme adapter     | `vueforge.test.ts` + CodeBlock suite | **PASS** — exact syntax map, 51 package tests                       |
| Production browser console/network errors        | `npm run visual:phase2`              | **PASS** — 0 browser errors and 0 network failures                  |

Implemented contracts check 66/85/997 counts, 847 legacy keys, 137 dark overrides, the alias graph, supported semantic
pairings, real Alert/Badge/Tag/Field/Progress/CodeBlock combinations, standalone CodeBlock fallbacks, exact Shiki
adapter roles, the semantic-first legacy fallback shape, and the prohibition on new raw colors/primitives in package
component CSS. The permitted literal exception is limited to six standalone CodeBlock OKLCH fallbacks; the composition
keywords `transparent`/`currentColor` are not palette materials. The only direct primitive mapping is the documented
composited `overlayFloatShadow` with two Neutral 1000 alpha levels.

## 15. Visual regression summary

The `npm run visual:phase2` command was added. The script checks four routes (`/colors`, `/core`, `/codeblock`,
`/playground`) in light/dark on desktop `1440×1100` and mobile `390×844`:

- **16** standard screenshots;
- **8** CVD screenshots: protanopia, deuteranopia, tritanopia, and achromatopsia × light/dark;
- rendered primitives/statuses/semantic surfaces and scoped light/dark panels;
- visible focus, control boundary, and invalid states;
- browser-computed cascade for invalid + focus/open, disabled Dropdown/navigation/Select hover, secondary action boundary,
  and selected + hover/active through `CSS.forcePseudoState`;
- CodeBlock Shiki tokens, matching editor background, selection/copy focus, and resolved scope;
- Playground surface, border, content/iframe, and resolved scope;
- horizontal overflow, browser/runtime/console errors, HTTP failures, and `Network.loadingFailed` for local assets.

When `VUEFORGE_VISUAL_BASELINE_DIR` is set, the script requires an exact byte match with the supplied baseline; without
the variable, it creates a manifest with SHA-256 hashes for manual before/after review.

The actual production browser run completed: **16** standard and **8** CVD screenshots were produced. The manifest was
saved to `/private/tmp/vueforge-phase2/manifest.json`; `browserErrors` and `networkErrors` are empty. All desktop/mobile
captures were reviewed manually: document-level horizontal overflow is absent, while the internal horizontal scrolling
of a long CodeBlock is expected behavior.

The before/after comparison used a freshly built Phase 1 commit `dc2b333` on the same desktop routes for Core,
CodeBlock, and Playground in light/dark. Exact byte comparison was not used: Phase 2 intentionally changes the palette
and state showcase and adds a new `/colors` route, so pixel identity is not a valid acceptance criterion. Manual
comparison found no changes to geometry, typography, or document structure.

Observed intentional visual changes:

- the neutral canvas/surface hierarchy has a less incidental blue cast and is better separated by borders in both themes;
- primary/status foregrounds, solids, subtle materials, and state colors use the new OKLCH palette;
- focus, control, and secondary action boundaries are more visible;
- CodeBlock syntax and editor background now form a single light/dark theme pair;
- Playground uses the same editor/surface roles as CodeBlock and Core;
- disabled CodeBlock no longer weakens the entire syntax subtree with the built-in opacity `0.6`.

All eight CVD captures were reviewed for light/dark. Status labels/icons, the focus outline, and structural selected cues
remain visible; known cases where a consumer can remove a non-color cue or where a selected option remains primarily
color-based are listed in section 7.

## 16. Color system assessment before and after

Baseline scores are preserved from the original audit. Final scores account for architecture/contracts, the contrast
matrix, and manual assessment of the desktop/mobile/CVD captures from section 15.

| Area               | Before Phase 0 | After Phase 2 | Rationale                                                        |
| ------------------ | -------------: | ------------: | ---------------------------------------------------------------- |
| Token architecture |           4/10 |          9/10 | canonical OKLCH scales, mode maps, semantic component boundary   |
| Palette harmony    |           6/10 |          8/10 | coherent hue/chroma progression confirmed by visual review       |
| Neutral palette    |           6/10 |          8/10 | separate surface hierarchy, text and boundary steps              |
| Primary            |           5/10 |          8/10 | independent solid/link/subtle/selected states                    |
| Semantic colors    |           4/10 |          9/10 | independent status fg/bg/border/icon/interaction roles           |
| Light theme        |           7/10 |          8/10 | stronger hierarchy/focus without heavy borders                   |
| Dark theme         |           4/10 |          8/10 | separately authored surfaces and chromatic foregrounds           |
| Component states   |           5/10 |          8/10 | documented compound precedence and semantic-first migration      |
| Accessibility      |           4/10 |          9/10 | supported text/UI/syntax matrix and CVD review pass the criteria |
| Consistency        |           5/10 |          8/10 | shared roles across Core, CodeBlock and Playground               |
| Visual uniqueness  |           5/10 |          7/10 | restrained VueForge character retained after visual review       |
| Scalability        |           4/10 |          9/10 | machine-readable names, graph/contrast/policy/export contracts   |

## 17. What remains for the next phase

After Phase 2, the following remain:

- public API decisions for non-color cues in Badge/Tag/Progress and invalid controls, if an automatic cue is actually needed;
- further semantic migration of remaining ecosystem-specific component mappings not touched by the current diff;
- persistent, reviewed screenshot baselines and a CI pixel-diff policy instead of only a local script;
- forced-colors/high-contrast and Axe/browser-level accessibility gates;
- a visited-link policy and additional pairings only when a real use case emerges;
- expansion of the browser matrix with an sRGB fallback preset if product support extends beyond modern `oklch()` browsers;
- a further reduced-motion/motion-state audit, which is not directly related to the color palette;
- a documented deprecation/migration cycle and removal of the legacy bridge only in VueForge 2.

Phase 2 does not remove legacy tokens or begin the VueForge 2 breaking cleanup.
Work stopped at the Phase 2 boundary; the listed items were not implemented in this commit.
