# VueForge: Final Color System Audit

> **Historical audit.** This report records the baseline and proposal from before the target palette was implemented. The implemented
> state and current constraints are documented in the [Phase 2 report](./phase-2-report.md).

Last updated: 2026-07-22. Status: **Phase 1 completed; palette values and component rendering preserved**.

Related documents:

- [Color Inventory](./color-inventory.md)
- [Color Accessibility Audit](./accessibility-colors.md)
- [Phase 0 Implementation Report](./phase-0-report.md)
- [Phase 1 Implementation Report](./phase-1-report.md)

## Executive summary

VueForge already looks like a polished, developer-oriented UI library: a calm, cool neutral base, a recognizable blue primary, a single preset source of truth, token-based CSS without stray HEX values inside core components, and good baseline contrast for primary/muted text.

The initial audit identified the following architectural and visual conflicts; Phase 0 resolved the transport drift in items 4–6, while Phase 1 introduced the role architecture from items 1–2 without component migration:

1. A single chromatic token is used both for text/icons and as a solid background. In a dark theme, these requirements are mathematically incompatible, resulting in systemic AA failures.
2. `colorBorder` serves both as an almost invisible decorative divider and as the only boundary for form controls.
3. The focus ring has a contrast ratio of only 1.65:1 in light mode and 1.52:1 in dark mode.
4. The actual preset, public TypeScript types, static CSS, and runtime CSS diverge.
5. The full stylesheet and component entry CSS are maintained manually in two places and already produce different cascade/geometry.
6. The scoped/local theme contract in CodeBlock/Playground and some provider options do not visually deliver the promised behavior.
7. Shiki palettes are used on a different background, so syntax highlighting does not meet AA.
8. There is no automated contrast, focus, scoped-theme, or visual-regression gate.

Conclusion: the current system should not be "fixed" by replacing HEX values en masse. First normalize the contract and roles, then select values, and only then migrate components.

## Phase 0 Outcome

Phase 0 addressed only contract/build/runtime drift, without changing the palette or moving to the new semantic architecture:

- all 847 core tokens actually supported are represented in the TypeScript contract; the previously missing 95 fields were added as optional for 1.x compatibility;
- static core CSS, runtime generation, and layouts use a single algorithm for serializing custom-property names;
- nine incorrect fallback names were replaced with canonical names, and exhaustive parity tests prevent their return;
- the root fallback retains compact dark overrides, while scoped light/dark boundaries receive a complete reversible set of variables and `color-scheme`;
- the full stylesheet is now composed from the same canonical component entries; a dedicated parity gate checks for omissions and duplicates;
- fallback behavior for floating labels, Drawer, and Command Palette was restored;
- ThemeProvider synchronizes configured root aliases; CodeBlock and Playground resolve the theme from the nearest valid DOM boundary and preserve inherited component-token overrides; the sandboxed Playground iframe receives the resolved mode and `--vf-*` variables through a verifiable bridge;
- package CSS/export/consumer contracts and light/dark browser smoke tests cover the affected paths.

The color and accessibility findings below remain open. Palette token values, the Shiki palette, contrast ratios, and visual character were not changed in Phase 0. The complete list of decisions and checks is provided in the [Phase 0 report](./phase-0-report.md).

## Phase 1 Outcome

Phase 1 created the target separation of token roles without migrating component CSS or replacing the palette:

- 29 primitive material tokens were added, containing only HEX/black values already in use;
- a contract of 77 semantic roles was introduced: background, text, icon, border, interaction, and five status families with eight roles each;
- `colorFocusRing` belongs to both the preserved legacy contract and the semantic set, so there are 76 new semantic keys;
- all 847 legacy keys were preserved; the built-in preset was expanded to 952 keys;
- the compatibility graph is one-way: semantic roles and current component aliases resolve independently through legacy roots to primitives; component → semantic migration was deferred to Phase 2;
- public name tuples/types, static/runtime maps, full/component-entry, scoped, fallback, and custom-prefix paths use a single contract;
- foreground, solid background, subtle background, border, and icon are now distinct public roles, even when their current material values are identical;
- a separate help scale was retained because of the actual public API and its consumers;
- confirmed dead and ambiguous tokens were only documented as v2 candidates; they were neither removed nor given runtime warnings.

Phase 1 does not fix the contrast failures listed below: components still read the previous aliases, while target OKLCH values and state migration belong to Phase 2. The complete architecture and mapping are published in the [Color Tokens guide](../core/guides/color-tokens.md).

## Strengths to Preserve

- Brand character: rigorous, minimalist, technical, calm, and developer-oriented.
- The light canvas is not dazzling white; dark-mode text is not excessively bright.
- Primary and muted text comfortably meet AA.
- All solid semantic buttons have a contrast ratio of at least 5.04:1.
- Core component CSS uses custom properties almost exclusively; there are no stray literal HEX/RGB/HSL values in UI rules.
- Layouts, CodeBlock, and Playground largely inherit the core semantic layer.
- Icons use `currentColor`; black/white in SVG masks are not part of the visible palette.
- The showcase covers components broadly and supports a real light/dark review without creating an audit page.
- The current geometry, CSS export, and unit contracts provide a good foundation for expanding checks.

## Current Visual Character

VueForge currently feels closest to "a restrained technical library for internal interfaces." The palette is cool, low-noise, and sufficiently professional. It does not look playful or consumer-oriented. However, weak elevation, barely visible borders/states, and a generic GitHub syntax palette make the interface less distinctive and less premium than its strong underlying geometry would allow.

The recommended direction is not a radical rebrand, but a more precise hierarchy with the same character: preserve the cool blue/blue-gray, improve role clarity, give dark foreground colors separate lighter stops, and add a very restrained elevation scale.

## Initial Assessment Before Phase 0

The scores below capture the initial state and were not recalculated after the infrastructure-focused Phase 0. The architectural drift in items 4–6 was eliminated or narrowed, but palette/semantic/accessibility debt was intentionally left untouched.

| Aspect                 | Score | Rationale                                                                                                        |
| ---------------------- | ----: | ---------------------------------------------------------------------------------------------------------------- |
| Token architecture     |  4/10 | One preset source, but no primitive layer; 847 keys, 95 untyped; flat component aliases                          |
| Palette harmony        |  6/10 | Calm and cohesive base, but status colors are not built as scales, and light-surface temperatures diverge        |
| Neutral palette        |  6/10 | Good text/muted; surface and borders are too similar; disabled/placeholder roles are not separated               |
| Primary/accent         |  5/10 | Recognizable restrained blue; dark foreground fails; a separate accent role is absent and not yet needed         |
| Semantic colors        |  4/10 | Solid variants are good, but foreground/solid are conflated; soft statuses fail broadly                          |
| Light theme            |  7/10 | Clean and comfortable, but flat; borders/focus and light warning/syntax need correction                          |
| Dark theme             |  4/10 | Comfortable neutrals, but primary/error/help/status foreground and focus are systematically too dark             |
| Component states       |  5/10 | Broad coverage, but contrast, precedence, disabled/read-only/indeterminate, and compound states are inconsistent |
| Accessibility          |  4/10 | Primary text is good; focus, controls, links, statuses, and syntax contain confirmed failures                    |
| Consistency            |  5/10 | A common language is visible, but full/entry CSS, local theme, and cross-component aliases already diverge       |
| Visual distinctiveness |  5/10 | VueForge is recognizable for its restraint, but palette/elevation/syntax are still generic                       |
| Premium feel           |  5/10 | Polished, but weak hierarchy, undocumented contracts, and states reduce the sense of completeness                |
| Scalability            |  4/10 | The runtime engine is useful, but a huge manual type/API surface and lack of a schema create drift               |

## Key Issues by Priority

### Critical

| Issue                                                        | Files/components                                                            | Impact                                                         | Cause                                          | Solution                                                       | Risk                          | Verification                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Focus ring below 3:1                                         | `default-preset-source.ts`; all focusable core components; CodeBlock copy   | Keyboard focus nearly disappears                               | 32/42% primary mix; CodeBlock has no outline   | separate `focus.ring`; shared focus recipe; add CodeBlock ring | Medium visual risk            | computed contrast + keyboard screenshots in both themes |
| Control boundary below 3:1                                   | Field/Input/Textarea/Select/Checkbox/Radio/Switch                           | An empty control is difficult to identify                      | one `colorBorder` for both divider and control | `border.subtle/default/control`; control at least 3:1          | Medium; UI will gain contrast | rendered boundary contrast on canvas/surface            |
| Chromatic role conflation                                    | links, errors, Badge, Tag, Alert icon, progress, selected states            | Dark primary/danger/help/status text 2.27–2.99:1               | one color for foreground and solid             | `foreground/solid/on-solid/subtle/border/graphic` per tone     | High reach                    | semantic pair tests + visual matrix                     |
| Static/runtime token names diverge — **resolved in Phase 0** | `theme-css-artifacts.ts`, `theme/runtime.ts`, Field, Drawer, CommandPalette | fallback CSS broke label transform, drawer motion, icon offset | two serializer algorithms                      | implemented shared serializer + exhaustive parity test         | Low after fixture coverage    | fallback-only page, all-key parity                      |
| Syntax palette does not meet AA                              | CodeBlock/Shiki                                                             | Small code text has 2.95–4.34:1 contrast                       | GitHub token colors on a VueForge background   | custom Shiki theme/syntax roles                                | Medium visual risk            | every rendered syntax fg/background >=4.5               |

### High

| Issue                                                                                      | Files/components                                                          | Impact                                                                                                                                 | Recommended solution                                                                  | Risk/verification                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 95 preset keys missing from public type — **resolved in Phase 0**                          | `core/src/theme/default-preset*.ts`, `core/src/types/theme.ts`            | part of the existing theme could not be safely overridden through TS                                                                   | 95 optional fields, `satisfies`, and exact-key contract                               | Low-risk additive API; compile/type tests      |
| Scoped/local theme contract broken — **resolved in Phase 0**                               | ThemeProvider, CodeBlock, Playground/iframe                               | local dark remained light or mixed dark syntax with a light surface                                                                    | nearest resolved-theme contract and complete scoped variable map                      | Low after inverse/nested/iframe tests          |
| `prefix/rootSelector/attribute` allow nonfunctional combinations — **resolved in Phase 0** | theme runtime/provider/docs                                               | configured roots and aliases are synchronized; invalid selectors receive a fallback; custom prefixes are bridged to compiled CSS names | preserve 1.x API; generate canonical `--vf-*` / `--vf-layout-*` aliases               | Low after configuration/custom-prefix fixtures |
| Two component CSS sources diverge — **resolved in Phase 0**                                | `components/*.css`, `entries/*.css`; Forms/NavMenu/CommandPalette/Stepper | full and standalone imports looked different; Stepper pulled in ~49 KB of navigation CSS                                               | canonical entries + aggregate composition + parity gate                               | Low after packaging/consumer/smoke checks      |
| Compound-state precedence is inconsistent                                                  | Select, Switch, disabled menus/Tabs/Stepper                               | invalid disappears when open/focused; double opacity                                                                                   | unified precedence `disabled > invalid > focus/open > hover > base`; state fixtures   | Medium visual risk; pairwise states            |
| No browser a11y/visual gates                                                               | CI, Stylelint, Vitest                                                     | regressions pass 318 tests                                                                                                             | contrast module, browser computed-style, keyboard, screenshots, fallback/scoped theme | Low; monitor CI runtime                        |

### Medium

| Issue                                                        | Impact                                                                            | Solution                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Surface/elevation differ by 1.04–1.24:1, `shadow:none`       | Cards/layouts look flat; dark nesting is lost                                     | `surface.subtle/elevated` + a small systematic shadow scale after visual tuning           |
| 54 duplicate alias groups and cross-component aliases        | 53 tokens equal text, 38 equal primary; changing NavMenu affects MenuBar/Dropdown | retain a component token only as a real boundary; remove component→component dependencies |
| Dead public tokens                                           | 2 core color tokens, 20 Playground, 1 CodeBlock, 1 Layout token                   | deprecation cycle; remove only in a major release or document as an extension point       |
| Opacity on a subtree                                         | Disabled/Header/Stepper/Tabs depend on the background                             | explicit disabled fg/bg/border; use opacity only where the result is verified             |
| Read-only/indeterminate/disabled gaps                        | Input/Textarea readonly is indistinguishable; Checkbox has no indeterminate state | add models and tokens only where the API actually supports them                           |
| Shadow/backdrop and inverse roles are implicit               | raw black recipes; Layout header uses text as a background                        | `overlay.backdrop`, `shadow.overlay`, `surface.inverse`, `fg.on-inverse`                  |
| CodeBlock/Playground theming documentation is empty          | dozens of public vars without a contract                                          | generated token tables, scoped theme/contrast guarantees                                  |
| Mobile `/core` has a 441 px scrollWidth at a 390 px viewport | possible overflow in MenuBar/DataTable/upstream container                         | locate the first overflowing ancestor; do not mask it globally with `overflow-x:hidden`   |

### Low

- Normalize `warn` to `warning` in the next major release or document the exception.
- Decide whether `help` is an independent status; do not implicitly turn it into an accent.
- Rename the ambiguous `contrast/contrast-contrast` to inverse semantics in the clean v2 contract.
- Document `#396fb6` as a brand asset color, or differentiate/deduplicate the two identical demo logos.
- Add an icon showcase at 16/20/24 px and on semantic surfaces.
- Standardize the `color-mix` space and reduce 23 arbitrary ratios to a small state scale.

## Component Conclusions

The complete state matrix is in the inventory; the main cross-cutting conclusions are:

- Button/IconButton geometry is cohesive; solid tones are legible, but focus and subtree opacity need correction.
- Forms have systematically weak boundaries; readonly has no visual treatment; invalid compound states lose their danger cue.
- Checkbox/Radio/Switch need a stronger unchecked boundary and a non-color invalid cue; Checkbox has no indeterminate state.
- Navigation covers many states, but dark primary/current indicators are weak, and disabled branches and full/entry CSS diverge.
- Feedback body text is generally legible; status foreground/icons/graphics and Badge/Tag require separate roles.
- Overlays use a functional floating shadow, but no elevation schema exists; fallback Drawer tokens are broken by the serializer.
- CodeBlock requires its own syntax palette and focus contract.
- Slider, DatePicker, Tree, Toast/Notification, and standalone Pagination are absent from the current repository; audit results cannot be attributed to them.

## Visual Review

The existing playground/showcase was reviewed without adding an audit page:

- routes `/core`, `/layouts`, `/icons`, `/codeblock`, `/playground`;
- light and dark;
- desktop 1440×1000 and mobile 390×844;
- typical compositions, forms, navigation, feedback, surfaces, dialogs/drawers, and forced focus.

Observations:

- Light mode looks clean and calm, but surface/canvas and muted surface nearly blend together; the hierarchy relies on overly weak borders.
- Dark mode is not dazzling and has no muddy hue cast, but nested surfaces and elevation nearly disappear.
- Dark blue/green/info/help/red foreground colors visually "sink"; screenshots confirm the calculated failures.
- The focus ring is present in CSS but barely visible; the problem is contrast, not a missing rule (except for CodeBlock copy).
- Solid actions look like the most complete part of the current palette.
- Layouts/icons/codeblock/playground do not create document overflow at 390 px; `/core` requires separate overflow diagnosis.
- The showcase is structurally useful, but does not show swatches, both themes side by side, locked pseudo-states, a local inverse theme, contrast results, or screenshot baselines.
- The published external docs site is excluded from the screenshot conclusions: its HTML/routes were available for structural verification, but a separate browser capture of the domain did not complete in the environment. Repository docs and the local showcase were reviewed in full.

## Token Architecture After Phase 1

```text
Current 1.x component aliases ───────────┐
                                        ├─→ legacy color roots ─→ 29 primitives
77 public semantic roles ────────────────┘

Phase 2 target: component decisions ─→ semantic roles
```

### 1. Primitive layer

Sparse scales `paletteNeutral*`, `palettePrimary*`, `paletteSuccess*`, `paletteInfo*`, `paletteWarning*`, `paletteDanger*`, and `paletteHelp*` were added. They contain only the 28 previous HEX values and the `black` value already in use; unused intermediate stops were not created. The runtime source remains in HEX, so Phase 1 introduces no OKLCH conversion/rounding drift.

### 2. Semantic layer

The contract contains 11 background, six text, four icon, eight border, eight interactive, and 40 status roles. Each success/warning/danger/info/help family is divided into solid background/foreground, subtle background/foreground, border, icon, hover, and active. `colorFocusRing` is retained as the only overlap with the legacy set.

Accent and syntax roles were not added: accent has no distinct product meaning, while Shiki migration belongs to ecosystem/Phase 2+. The complete exact-name contract is provided in the [Color Tokens guide](../core/guides/color-tokens.md).

### 3. Component layer

Component tokens remain justified for the Alert 8% primary subtle recipe, overlay composition, switch-specific composition, and the CodeBlock syntax adapter. Simple aliases such as `buttonText → colorTextPrimary` do not justify a new public token. Bulk migration of existing component aliases was deferred to Phase 2.

Canonical name tuples are the source of truth for TypeScript types and contract tests; build and runtime continue to import the single serializer from Phase 0.

## Proposed Target Palette for Phase 2 — Not Implemented

The tables below remain a separate design proposal for a future accessibility/OKLCH phase. None of these new values were applied in Phase 1. The implemented primitives retain the original HEX values listed in the public guide.

### Neutral roles

| Role             | Light                                | Dark                                 | Purpose                                       |
| ---------------- | ------------------------------------ | ------------------------------------ | --------------------------------------------- |
| Canvas           | `oklch(0.978 0.005 258)` / `#f6f8fb` | `oklch(0.214 0.010 268)` / `#17191e` | preserve the character of the current page bg |
| Surface          | `oklch(1 0 0)` / `#ffffff`           | `oklch(0.256 0.014 267)` / `#20232a` | base surface                                  |
| Surface subtle   | `oklch(0.966 0.006 256)` / `#f1f4f8` | `oklch(0.288 0.016 264)` / `#272b33` | nested neutral layer                          |
| Surface elevated | `#ffffff` + shadow                   | `oklch(0.309 0.017 266)` / `#2c3039` | overlays/cards, not the default container     |
| Foreground       | `oklch(0.271 0.025 261)` / `#202733` | `oklch(0.899 0.013 262)` / `#d9dee7` | primary text                                  |
| Muted            | `oklch(0.488 0.030 256)` / `#556171` | `oklch(0.745 0.018 259)` / `#a6adb8` | secondary text                                |
| Disabled         | `#7a8594`                            | `#747b86`                            | separate inactive role                        |
| Placeholder      | `#667085`                            | `#9da6b3`                            | do not couple to disabled                     |
| Border subtle    | `#d7dde5`                            | `#363b46`                            | decorative separators                         |
| Border default   | `#b3bdc9`                            | `#4d5664`                            | structural borders                            |
| Border control   | `#84909f`                            | `#687587`                            | 3.25:1 / 3.36:1 against surface               |
| Focus ring       | `oklch(0.530 0.136 247)` / `#0b70b5` | `oklch(0.756 0.117 241)` / `#65b9f3` | 5.25:1 / 7.33:1 against surface               |

Muted/surface: 6.30:1 light and 6.96:1 dark. Placeholder/surface: 4.97:1 and 6.40:1. Disabled remains weaker than the active foreground and should not additionally receive subtree opacity.

### Chromatic roles

| Tone    | Light foreground / solid / subtle | Dark foreground / solid / subtle  |
| ------- | --------------------------------- | --------------------------------- |
| Primary | `#0b67a3` / `#0b67a3` / `#e6f1f8` | `#6eb8ee` / `#24699e` / `#183247` |
| Success | `#2f7a3e` / `#2f7a3e` / `#e9f4eb` | `#79d18a` / `#347542` / `#203529` |
| Info    | `#00749b` / `#00749b` / `#e5f3f7` | `#6ac6eb` / `#19759b` / `#1e333d` |
| Warning | `#765f10` / `#d4ad46` / `#f8f0d8` | `#e2bd68` / `#b88e32` / `#39301f` |
| Danger  | `#bc3542` / `#bc3542` / `#f9e8ea` | `#ff818a` / `#b7434c` / `#3b252b` |
| Help    | `#6d4695` / `#6d4695` / `#f1eaf7` | `#c7a0ea` / `#764d93` / `#30283a` |

`on-solid` remains white, except for warning (`#241a00` light, `#211700` dark). The proposed foreground/subtle pairs have minimum contrast ratios of 4.66:1 in light mode and 5.90:1 in dark mode; on-solid/solid has a minimum of 5.17:1.

Meaningful changes:

- Primary retains its hue and restraint; the dark foreground becomes lighter, while solid remains dark enough for white.
- Success/info/danger/help receive separate dark foreground stops and no longer sink into the surface.
- Warning foreground becomes darker in light mode, while solid remains light with a dark on-solid.
- The neutral hierarchy becomes explicit without turning the interface into a heavy grid of borders.

Before implementation, the OKLCH browser-support contract must be established. The project already requires `color-mix()`, so a modern color pipeline is acceptable, but production CSS may retain verified sRGB fallbacks/fixtures.

## Change Plan

The recommended path is a staged 1.x migration with a clean v2 endpoint. Public legacy custom properties cannot be silently removed in a minor release.

### Phase 0 — Contract Correctness, No Redesign — **Completed**

Implemented:

- a single serializer for runtime, the core static build, and the layouts static build;
- exact preset/type/static/runtime contracts for 847 core and 124 layout tokens;
- canonical names for nine fallback variables;
- complete reversible scoped light/dark maps with `color-scheme`;
- functional configured `rootSelector`/`attribute` without changing public signatures;
- a custom-prefix compatibility bridge for Core and Layouts;
- synchronization of `data-theme`/`data-vf-theme`/configured attributes and a deterministic invalid-selector fallback;
- canonical component-entry CSS and automatic full/entry composition parity;
- an inherit/resolved marker split and nearest-boundary contract for CodeBlock/Playground, including the sandboxed iframe;
- regression tests and package CSS/export/consumer contracts.

Details: [Phase 0 implementation report](./phase-0-report.md).

### Phase 1 — Primitive/Semantic Architecture — **Completed**

Implemented:

- canonical tuples/types for 29 primitives and 77 semantic roles;
- an existing-value primitive palette without new OKLCH/HEX values;
- 76 additive semantic keys and the retained semantic `colorFocusRing`;
- a 952-key built-in preset while fully preserving the 847-key legacy API;
- one-way compatibility mapping without undefined aliases or cycles;
- exact light/dark, runtime/static, custom-prefix, and scoped-theme contracts;
- public naming, theming, migration, and v2 deprecation documentation.

Details: [Phase 1 implementation report](./phase-1-report.md).

### Phase 2 — core component states

Files:

- `packages/core/src/styles/entries/*.css` as the intended canonical source;
- aggregate CSS generation/composition;
- Vue components and tests only for confirmed state/a11y gaps;
- showcase state matrix.

Actions: migrate components to semantic roles; target OKLCH/light-dark values; focus/control/status/link mapping; state precedence; disabled/readonly/indeterminate; eliminate color-only cues; reduced motion; full/subpath parity.

### Phase 3 — ecosystem

Files:

- layouts preset/mappings;
- CodeBlock tokens/CSS/Shiki theme;
- Playground host/iframe theme sync;
- docs/examples/logo decision.

Actions: optional provider-local wrapper boundary; SSR hint; syntax palette; inverse roles; dead token deprecations; elevation tuning.

### Phase 4 — Gates and Documentation

Files:

- CI/scripts/tests;
- Stylelint/literal audit allowlist;
- `docs/**/theming.md` and showcase.

Actions: contrast/reference/parity checks, computed-style browser smoke, keyboard focus, screenshots light/dark 1440/390, fallback/local theme, forced colors, generated token documentation.

### Phase 5 — Clean v2 (Separate Decision)

- remove deprecated aliases and dead public tokens;
- rename ambiguous `warn` and `contrast` roles;
- make the component API substantially smaller;
- publish a migration map and visual diffs.

## Migration risks

- The palette role split affects almost every component, but allows solid colors to remain separate and reduces the risk of a broad regression.
- CSS custom properties are effectively a public API even without a TypeScript declaration; remove them only through deprecation/a major release.
- Fixing scoped themes changes specificity and SSR/hydration; a matrix of nested providers is required.
- A custom Shiki theme will change all code screenshots and may affect payload size.
- The canonical CSS source affects package subpaths; export/consumer isolation tests are mandatory.
- Stronger control borders and elevation require design review on complex layouts to avoid making the UI feel heavy.

## Verification After Each Phase

1. `npm run typecheck`, package tests, and CSS contracts.
2. generated/runtime/type exact parity.
3. contrast fixtures and computed-style pairs for both themes.
4. standalone CSS subpaths without the full bundle or runtime plugin.
5. root light/local dark, root dark/local light, nested provider, dynamic switch.
6. SSR/hydration and Playground iframe custom variables.
7. keyboard-only focus and accessible-name/relationship assertions.
8. screenshots at 1440×1000 and 390×844.
9. no document overflow, hardcoded-color audit, bundle/export regression.
10. grayscale/color-vision review semantic statuses.

## Completed Verification of the Initial State

- Full `npm test`: pass.
- Core: 187 tests pass; CSS contract, form geometry, and 43 CSS export checks pass.
- CodeBlock: 37 tests pass; CSS export/consumer smoke pass.
- Playground: 24 tests pass; CSS export/consumer smoke pass.
- Layouts: 50 tests pass; CSS contract and 21 CSS export checks pass.
- Theme: 6 tests pass.
- Playground core/plugin: 14 tests pass.
- Icons build/render smoke pass.
- Total Vitest: 318 tests pass, plus package smoke/contract checks.

These results do not invalidate the audit: the existing tests verify DOM/strings/exports, but not serializer parity for all keys, computed contrast, focus rendering, scoped themes, or visual parity.

## Verification After Phase 0

- Full workspace test suite: 365 Vitest tests, package smoke/contract checks, and Icons render smoke pass.
- TypeScript, ESLint, and Stylelint pass in all workspace packages.
- The library build and production showcase/docs build pass.
- Core static/runtime contract: 847 light variables, 53 root dark overrides, and 847 variables in each scoped light/dark map.
- Layouts static/runtime contract: 124 variables in light and each scoped mode; root dark retains two overrides.
- All 9 canonical fallback names are present; all 9 previous malformed names are absent.
- The full stylesheet contains every canonical component entry exactly once; standalone CSS export/consumer checks pass.
- Browser smoke without runtime style confirmed floating labels, Drawer, and Command Palette in light/dark.
- Browser smoke for scoped themes confirmed CodeBlock and Playground, including the actual sandbox iframe preview, in light/dark; no page errors were recorded.

Phase 0 did not introduce an automated contrast/Axe/screenshot-diff gate; that remains a task for subsequent palette/accessibility phases. Captures from the current smoke tests were used for manual review and were not added as new baseline assets.

## Verification After Phase 1

- Public name contracts define 29 primitives and 77 semantic roles without duplicate names.
- Built-in preset/type/static/runtime maps contain 952 keys: 847 legacy + 105 unique additions.
- Light/dark and scoped maps have the same complete key set.
- The alias graph contract checks missing references, self-references, and cycles.
- The custom-prefix contract checks the requested namespace and canonical `--vf-*` bridge.
- Full stylesheet and component-entry paths continue to use the generated Phase 0 contract.
- Legacy material values and 1.x token names are compared against the recorded baseline.

The final workspace test/build/smoke commands and quantitative results are provided in the [Phase 1 report](./phase-1-report.md).

## Constraints and Decisions After Phase 0

1. A compatible 1.x layer was selected and implemented for Phase 0; clean v2 remains a separate decision.
2. Scoped theme semantics are defined by the nearest valid DOM light/dark boundary; Provider synchronizes only configured roots.
3. An arbitrary custom prefix was retained; Core and Layouts runtime emit the requested variables together with canonical compatibility aliases for existing compiled component CSS.
4. Dynamic insertion/replacement of a configured Provider root without changing mode is not tracked; this is a rare edge case that does not block Phase 0.
5. Changing external stylesheets without a DOM/attribute mutation does not trigger another snapshot of Playground variables; mode/ancestor/reparenting cases are covered.
6. `help` is defined as a separate semantic family because of the existing public tone and real consumers; target OKLCH values, elevation tuning, and `#396fb6` remain decisions for subsequent phases.
7. Future palette/semantic changes will require a new visual pass of the published docs site.

Phase 1 is complete. The target OKLCH palette, accessibility corrections to values, and component migration have not begun and remain in the scope of Phase 2.
