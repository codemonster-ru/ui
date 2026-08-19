# VueForge: Phase 0 implementation report

Completion date: 2026-07-21. Status: **complete; Phase 1 was not started**.

## Scope and outcome

Phase 0 eliminated discrepancies between the public TypeScript contract, runtime theme generation, static CSS build, full stylesheet, and component-entry CSS. It also restored the fallback and scoped-theme paths that directly depended on these contracts.

Semantic tokens, the OKLCH/material palette, accessibility color correction, a new Shiki palette, revised component states, and visual redesign remained out of scope.

Final invariants:

- canonical core preset contains 847 keys, and the same keys are available through `VfThemeTokens`;
- static and runtime use one serializer for custom-property names;
- root fallback, scoped modes, and runtime are aligned in names and values;
- full CSS is assembled from the same canonical entries published as component subpaths;
- fallback-only and runtime-enabled consumers receive identical variable names;
- the nearest valid DOM theme boundary determines the CodeBlock and Playground theme, including the sandboxed preview;
- no color palette value was changed.

## Causes of the original discrepancies

| Discrepancy                                          | Specific cause                                                                                                                                                  | Behavior before Phase 0                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 95 preset keys were missing from TypeScript          | `defaultThemePresetSource` was first inferred as an untyped intermediate object and only then assigned to a typed export; the excess-property check did not run | the built-in token existed in CSS/runtime, but TypeScript prevented safe overrides                                                       |
| Nine custom-property names differed                  | static build and runtime contained independent camelCase → kebab-case regex algorithms                                                                          | static CSS produced `...-ydefault`, `...-xrest`, `...-xleft`; runtime produced the canonical `...-y-default`, `...-x-rest`, `...-x-left` |
| Scoped light/dark modes were not reversible          | root baseline and partial dark overrides did not define a complete mode map on the local boundary                                                               | root dark/local light and nested inverse themes inherited some variables from the opposite mode                                          |
| Layouts used separate serialization                  | layouts build maintained a third converter, including a local special-case replacement for `zindex`                                                             | core/runtime/layouts could diverge with new token shapes                                                                                 |
| Full and entry CSS were maintained manually          | aggregate group files duplicated the contents of `entries/*.css`                                                                                                | Select geometry, Command Palette cascade, Stepper payload, and transition guard differed                                                 |
| Floating label, Drawer, and Command fallback broke   | consumers read canonical names that were absent from static fallback                                                                                            | runtime style concealed the defect; without the plugin, transform/motion/icon offset were lost                                           |
| Provider options were not applied to configured root | provider always wrote the mode to `document.documentElement` and only to one attribute                                                                          | `rootSelector`/engine attribute could generate CSS that the provider did not actually activate                                           |
| CodeBlock local theme depended on root assumptions   | the component searched attributes in separate passes, token aliases were declared only on `:root`, and explicit → inherit was not recomputed                    | the nearest boundary could be ignored; local aliases were not overridden correctly                                                       |
| Playground snapshot used document root               | theme and variables were copied from `document.documentElement`; direct iframe access assumed same-origin                                                       | nested theme did not reach the host/preview; `sandbox="allow-scripts"` created an opaque origin                                          |
| Layouts emitted types diverged from runtime          | the dependency shim described serializer/apply helpers more narrowly than the actual implementation                                                             | published declarations did not match the actual return values                                                                            |

## Required fixes

The following changes were required to meet the agreed contract goals and were implemented without changing palette values:

1. One shared serializer in `packages/theme/src/css-vars.ts` for runtime, core build, and layouts build.
2. An additive TypeScript contract for all 847 built-in keys; 95 new declarations remain optional for 1.x source compatibility.
3. `satisfies CompleteDefaultThemePreset` and an exact-key compile-time regression test.
4. Complete scoped light/dark maps. The root path retains baseline light declarations and only 53 core/two layout dark overrides to preserve the previous fallback model.
5. Canonical component entries and build-time composition with dedupe/cycle detection.
6. Exact-map, serializer, fallback-name, CSS parity, export, and consumer regression tests.
7. Nearest-boundary mode for CodeBlock/Playground and safe delivery of computed `--vf-*` variables to the sandbox iframe.

## Potentially controversial decisions and selected approach

| Decision                                       | Selected approach  | Rationale                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Make the 95 fields required or optional        | optional           | required fields would break existing complete custom presets in VueForge 1.x; the built-in preset is separately verified as complete                                                                                           |
| Scoped mode as a delta or a complete map       | complete map       | only a complete map reliably cancels inherited opposite-mode values and preserves component aliases in nested inverse themes                                                                                                   |
| Preserve incorrect static spellings as aliases | do not preserve    | these nine names were not source/public tokens and were absent from runtime; propagating accidental names to every path would entrench the drift. Removing them from the static artifact is the intended fallback contract fix |
| Aggregate CSS or entries as canonical source   | entries            | the component subpath must remain isolated; aggregate manifests now only define the contents of the full bundle                                                                                                                |
| Add iframe `allow-same-origin`                 | do not add         | this would weaken the sandbox. The theme bridge works with an opaque origin and validates source, message type, mode, and the `--vf-*` payload                                                                                 |
| Narrow the `prefix/rootSelector/attribute` API | no breaking change | configured roots/attributes were fixed compatibly; with a custom prefix, Core and Layouts also generate canonical aliases for already compiled component CSS                                                                   |
| Change token values for visual alignment       | do not change      | Phase 0 is limited to delivering the existing contract; palette and accessibility require separate agreement                                                                                                                   |

## Implemented changes

### Token/type/runtime/static contract

- Added shared `serializeThemeTokensToCssVars()` with consistent camelCase/digit behavior and `createScopedThemeModeSelector()`.
- Core static artifacts use the same serializer as runtime.
- Runtime and fallback CSS set `color-scheme` on root and scoped mode boundaries.
- Runtime rule order is fixed as root baseline → custom dark selector → scoped light → scoped dark, so explicit local light overrides an outer custom dark selector.
- With a custom prefix, Core and Layouts generate requested variables and canonical `--vf-*` / `--vf-layout-*` aliases that reference them.
- The assembled full stylesheet preserves root `color-scheme: dark`: the later base rule recognizes `data-theme` and `data-vf-theme` identically.
- Core root dark remains a 53-key override; scoped light and dark contain complete 847-key effective maps.
- Layouts retains 124 light variables, two root dark overrides, and complete 124-key scoped maps.
- Nine canonical fallback variables are checked explicitly; the nine previous malformed spellings are prohibited by a regression test.
- `VfThemeTokens` was extended with 95 optional declarations; built-in preset and public keys are compared at the type level.
- Layouts public emitted declarations now match the actual `Record<string, string>` and `HTMLElement` return contract.

### Full stylesheet and component entries

- `entries/*.css` became canonical component styles.
- Six group files in `styles/components/` became import-only manifests.
- A new CSS composer recursively expands local imports, detects cycles, and includes each artifact once.
- The shared theme-transition guard is included identically in full/base and standalone component CSS.
- A shared horizontal-scroller fragment is used by MenuBar and Tabs without mutually importing large bundles.
- Stepper no longer includes the entire navigation bundle.
- Confirmed standalone parity was fixed for Input, Textarea, Select, Dialog, Drawer, MenuBar, Tabs, Stepper, and the already covered NavMenu/Command Palette rules.

### Fallback behavior

- Floating label reads the existing canonical `translate-y-default` variables and once again gets the correct transform without the runtime plugin.
- Drawer receives canonical rest/side offsets and restores transition geometry in every direction.
- Command Palette title icon receives the canonical default Y offset.
- Switch root-dark rules recognize `data-theme="dark"` and `data-vf-theme="dark"` identically.
- Contracts run fallback artifact generation before comparison and verify that the old spellings are absent.

### Scoped ThemeProvider, CodeBlock, and Playground

- `VfThemeProvider` finds configured roots and, on every update, writes the resolved mode to the engine attribute, requested attribute, `data-theme`, and `data-vf-theme`; conflicting aliases are normalized.
- Initial mode preserves the priority of storage/requested/engine attributes and then reads compatible root aliases, so SSR/fallback with only `data-theme` is not reset on mount.
- In browser context, an invalid `rootSelector` is normalized to `:root`, and an invalid explicit `darkModeSelector` to the canonical selector on the normalized root. A valid selector with no current matches is preserved.
- With `theme="inherit"`, CodeBlock and Playground retain `data-theme="inherit"` and `data-vf-theme="inherit"` on the host, while publishing the effective mode through `data-vf-resolved-theme="light|dark"`; explicit modes are still written to both theme attributes.
- CodeBlock and Playground determine mode from the nearest valid DOM boundary among their ancestors. `VfThemeProvider` itself does not create a wrapper/local boundary; it synchronizes configured roots.
- Component token defaults are declared on `:root` and actual light/dark boundaries, but not on a host with `inherit`; therefore, ancestor overrides of `--vf-codeblock-*` / `--vf-playground-*` are not overwritten by a self-boundary.
- Playground responds to relevant ancestor mutations/reparenting.
- Only computed properties with the `--vf-` prefix are passed to the preview; stale snapshot variables are removed before the new values are applied.
- The sandboxed iframe receives mode/variables through a postMessage bridge without `allow-same-origin`; the direct same-origin path remains as best-effort support for integrations and tests.
- The bridge accepts messages only from the parent, only of type `theme`, only with `light|dark`, and only with string `--vf-*` values.

## Contract matrix after Phase 0

| Path                    |                    Light |                         Dark |  Scoped light |   Scoped dark | Names                  |
| ----------------------- | -----------------------: | ---------------------------: | ------------: | ------------: | ---------------------- |
| Core static fallback    |                      847 | 53 overrides / 847 effective |           847 |           847 | shared serializer      |
| Core runtime            |                      847 |                847 effective |           847 |           847 | shared serializer      |
| Layouts static fallback |                      124 |  2 overrides / 124 effective |           124 |           124 | shared serializer      |
| Layouts runtime         |                      124 |                124 effective |           124 |           124 | shared serializer      |
| Full core stylesheet    |    canonical entry union |        canonical entry union | same contract | same contract | no duplicate entry     |
| Component-entry CSS     | isolated canonical entry |     isolated canonical entry | same contract | same contract | export/consumer tested |

Ecosystem token surfaces were not reduced: CodeBlock retains 55 custom properties, and Playground retains 48. Layout/core legacy tokens were preserved.

## Changes that may affect appearance

Palette values and visual language were not changed. The only visible changes are restoration of the previously specified behavior and elimination of full/entry differences:

- floating labels once again occupy the active position in fallback-only mode;
- Drawer once again uses the specified directional offsets and enters/exits correctly without the runtime theme plugin;
- Command Palette icon receives the intended vertical offset;
- standalone Input/Textarea receive the same block geometry as the full stylesheet;
- standalone Select receives the same floating sizes/padding, clear-button geometry, and option foreground as the full stylesheet;
- standalone Dialog/Drawer receive the same close/action icon styles;
- standalone MenuBar/Tabs receive the same horizontal-scroller behavior;
- scoped CodeBlock and Playground actually switch between the existing light/dark values;
- inherited CodeBlock/Playground no longer create their own light/dark boundary and preserve ancestor component-token overrides;
- Playground preview background/text and inherited variables match the host scope;
- `color-scheme` synchronizes browser-native controls inside the theme boundary;
- custom-prefix configurations now affect compiled Core/Layouts components through canonical compatibility aliases;
- root dark and Switch dark rules work identically with both compatibility attributes;
- invalid selector configuration receives a safe canonical fallback instead of failing to apply the theme;
- the shared transition guard now works identically with full and component imports.

These are parity/fallback fixes, not new design values. Complete scoped maps increase the size of generated CSS; this is a deliberate correctness trade-off and does not change runtime token values.

## Public API and 1.x compatibility

- No existing source token or legacy token was removed.
- No public token was renamed.
- Only optional properties were added to `VfThemeTokens`.
- Package export maps were unchanged.
- Runtime function signatures were preserved.
- The existing `setCodeBlockThemeVars` is additionally re-exported from the public `/view` entry; its subpath and signature were unchanged.
- Layouts `.d.ts` files were corrected to match the existing runtime behavior. This is an objective contract correction; code that relied on the previous incorrect return type may receive more accurate TypeScript inference.
- Nine malformed static-only names were removed from generated fallback CSS. They did not correspond to source keys, CSS consumers, or runtime output; canonical public names are now identical across all paths.
- CodeBlock/Playground retain both compatible theme attributes; for inherited mode, their value is now `inherit`, while the additive `data-vf-resolved-theme` separately reflects the effective mode.

## Verification

The following checks were completed:

| Check                                                  | Result                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `npm test`                                             | pass; 365 Vitest tests plus package smoke/contracts and Icons render smoke |
| `npm run typecheck`                                    | pass                                                                       |
| `npm run lint`                                         | pass                                                                       |
| `npm run lint:styles`                                  | pass                                                                       |
| `npm run lint:md`                                      | pass                                                                       |
| `npm run lint:docs-imports`                            | pass                                                                       |
| `npm run build`                                        | pass for all library workspaces                                            |
| `npm run build:demo`                                   | pass; production showcase/docs bundle built                                |
| Core CSS contract/parity/form geometry                 | pass                                                                       |
| Core CSS exports                                       | 43 CSS and 39 auto-CSS exports pass                                        |
| Layouts CSS/export contracts                           | 21 CSS and 17 JS exports pass                                              |
| CodeBlock/Playground CSS export and consumer isolation | pass                                                                       |
| Core static/runtime exact comparison                   | 847 light, 53 dark overrides, scoped 847/847 pass                          |
| Layouts static/runtime exact comparison                | 124 light, two dark overrides, scoped 124/124 pass                         |
| Canonical/malformed fallback names                     | 9/9 canonical present; 9/9 malformed absent                                |
| Full/component-entry composition                       | each canonical entry included exactly once                                 |

Manual production browser smoke testing was completed for light and dark without core runtime style injection:

- floating Input/Select/Textarea labels have non-empty canonical transforms;
- Drawer is open with the expected geometry and identity transform;
- Command Palette is displayed with the expected icon offset;
- all nine malformed variables are absent from computed styles;
- CodeBlock/Playground with `theme="inherit"` retain inherit markers, publish the correct `data-vf-resolved-theme`, and accept ancestor component-token overrides;
- explicit light/dark paths and the actual sandbox iframe preview use the previous palette values and the corresponding `color-scheme`;
- browser page errors are absent;
- 14 temporary screenshots were reviewed manually; no clipping or obvious full/entry/theme drift was found.

Screenshots and the temporary smoke script were not added to the repository. Phase 0 adds automated contract tests but does not claim an automated pixel-diff or contrast gate.

## Changed files

### Theme/core contract and build

- `packages/theme/src/css-vars.ts`
- `packages/theme/src/runtime.ts`
- `packages/theme/__tests__/runtime.spec.ts`
- `packages/core/build/theme-css-artifacts.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`
- `packages/core/src/theme/utils.ts`
- `packages/core/src/types/theme.ts`
- `packages/layouts/build/layout-css-artifacts.ts`
- `packages/layouts/src/theme/utils.ts`
- `packages/layouts/src/types/deps-shim.d.ts`
- `packages/layouts/__tests__/layouts.spec.ts`
- `packages/layouts/scripts/smoke-css-export.mjs`

### CSS composition, entries, and contracts

- `packages/core/build/css-imports.ts`
- `packages/core/vite.config.ts`
- `packages/core/package.json`
- `packages/core/scripts/check-css-contract.mjs`
- `packages/core/scripts/check-css-parity.mjs`
- `packages/core/scripts/check-form-geometry.mjs`
- `packages/core/scripts/smoke-consumer-auto-css.mjs`
- `packages/core/scripts/smoke-css-export.mjs`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/src/styles/components/actions.css`
- `packages/core/src/styles/components/base.css`
- `packages/core/src/styles/components/feedback.css`
- `packages/core/src/styles/components/forms.css`
- `packages/core/src/styles/components/horizontal-scroller.css`
- `packages/core/src/styles/components/navigation.css`
- `packages/core/src/styles/components/overlay.css`
- `packages/core/src/styles/components/surfaces.css`
- `packages/core/src/styles/components/theme-transition-guard.css`
- `packages/core/src/styles/entries/dialog.css`
- `packages/core/src/styles/entries/drawer.css`
- `packages/core/src/styles/entries/input.css`
- `packages/core/src/styles/entries/menu-bar.css`
- `packages/core/src/styles/entries/select.css`
- `packages/core/src/styles/entries/stepper.css`
- `packages/core/src/styles/entries/switch.css`
- `packages/core/src/styles/entries/tabs.css`
- `packages/core/src/styles/entries/textarea.css`
- `packages/core/src/components/stepper/VfStepper.spec.ts`

### Provider, CodeBlock, and Playground

- `packages/core/src/providers/VfThemeProvider.vue`
- `packages/core/src/providers/VfThemeProvider.spec.ts`
- `packages/core/src/__tests__/setup.ts`
- `packages/codeblock/src/codeblock.css`
- `packages/codeblock/src/index.ts`
- `packages/codeblock/src/tokens.css`
- `packages/codeblock/src/components/VfCodeBlock.vue`
- `packages/codeblock/src/components/__tests__/VfCodeBlock.test.ts`
- `packages/codeblock/src/__tests__/plugin.test.ts`
- `packages/codeblock/src/view.ts`
- `packages/codeblock/scripts/smoke-css-export.mjs`
- `packages/playground/src/VfPlayground.vue`
- `packages/playground/src/VfPlayground.spec.ts`
- `packages/playground/src/tokens.css`
- `packages/playground-core/src/runtimes/browserRuntime.ts`
- `packages/playground-core/__tests__/browserRuntime.test.ts`
- `examples/vue/src/sections/codeblock/CodeBlockShowcase.vue`

### Audit documents

- `docs/design-audit/color-audit-report.md`
- `docs/design-audit/color-inventory.md`
- `docs/design-audit/accessibility-colors.md`
- `docs/design-audit/phase-0-report.md`
- `docs/codeblock/guides/index.md`

## Deliberately deferred

- semantic role split, primitives, and OKLCH palette;
- any changes to HEX/color-mix values and contrast tuning;
- focus/control/status accessibility redesign;
- a new Shiki syntax palette;
- component state migration and color-only cue remediation;
- automatic detection of configured Provider root insertion/replacement without a mode change;
- automatic creation of a provider-local wrapper boundary: scoped mode is set by an explicit DOM attribute boundary;
- moving teleported overlays inside an arbitrary local boundary;
- repeating the Playground variable snapshot after a stylesheet-only mutation without a DOM/attribute event;
- version bump and coordinated publish of Theme/Core/Layouts; on release, Core/Layouts must require a Theme version with the shared serializer;
- automated Axe/contrast/pixel-diff/forced-colors CI gates.

Phase 0 is now complete. The next phase has not started.
