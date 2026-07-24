# VueForge: Phase 1 implementation report

Completion date: 2026-07-22. Status: **primitive/semantic architecture implemented; no transition to Phase 2 was performed**.

## Scope and result

Phase 1 added the target primitive and semantic color contract on top of the delivery infrastructure corrected in Phase 0. All existing VueForge 1.x tokens, palette values, component styles, and public component APIs were preserved.

```text
Before Phase 1
847 flat preset keys
└── 35 overloaded root color roles
    └── component aliases and direct component references

After Phase 1
current 1.x component aliases ───────────┐
                                        ├─→ legacy color roots ─→ 29 primitives
77 semantic roles ───────────────────────┘

Phase 2 target: component decisions ─→ semantic roles
```

The built-in preset now contains 952 keys. `colorFocusRing` was already part of the legacy contract and is also a semantic role, so 29 primitives + 77 roles yield 105 rather than 106 unique additions.

## Quantitative contract

| Contract                          |   Count |
| --------------------------------- | ------: |
| Primitive tokens                  |  **29** |
| Semantic roles                    |  **77** |
| New semantic keys                 |  **76** |
| Retained legacy keys              | **847** |
| Unique additions                  | **105** |
| Complete built-in preset          | **952** |
| Legacy dark overrides             |  **53** |
| Maximum canonical alias depth     |   **4** |
| Maximum custom-prefix alias depth |   **9** |

## Primitive architecture

Seven sparse material families were added:

- neutral: 16 stops;
- primary, success, info, danger, and help: two stops each;
- warning: three stops, including a dark on-solid material.

All 29 values already existed in the current preset or its black-alpha recipes. Phase 1 does not create intermediate shades or convert the runtime source to OKLCH, so the original sRGB output is preserved without rounding drift. Primitives are mode-independent: light/dark select different existing stops through compatibility roots. Hue and chroma are not normalized; numeric steps record the approximate baseline lightness order rather than a new interpolated scale. Neutral `0`/`1000` remain the white/black extremes, and `warning950` remains a separate on-solid material.

The complete table is provided in the [Color Tokens guide](../core/guides/color-tokens.md).

## Semantic architecture

| Category    |  Roles |
| ----------- | -----: |
| Background  |     11 |
| Text        |      6 |
| Icon        |      4 |
| Border      |      8 |
| Interactive |      8 |
| Status      |     40 |
| **Total**   | **77** |

The status contract is identical for success, warning, danger, info, and help:

```text
solid background / solid foreground
subtle background / subtle foreground
border / icon
hover background / active background
```

Foreground and solid background have different public names even though they temporarily resolve to the same primitive in Phase 1. This separates the architectural migration from the future accessibility palette.

`help` is retained as a separate family: it is a distinct public tone for Button, IconButton, Badge, Tag, Alert, ProgressBar, ProgressSpinner, and the text utility. Merging it with `info` would be both a semantic and visual breaking change.

## Legacy mapping and 1.x compatibility

None of the 847 legacy keys were removed or renamed. The default bridge is one-way. Phase 1 does not insert the semantic layer into existing component chains:

```text
semantic role ───────────┐
                        ├─→ legacy root → primitive
current component alias ┘

Phase 2 component migration: component decision → semantic role
```

Therefore, an existing override of `colorPrimary`, `colorMuted`, `colorBorder`, or a status root continues to affect semantic aliases. A reverse alias for the same pair is prohibited to avoid creating a cycle.

Main mapping:

| Legacy family                                  | Semantic target                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `colorBg`, `colorSurface`, `colorSurfaceMuted` | canvas/surface/subtle/elevated/disabled backgrounds                   |
| `colorText`, `colorMuted`                      | separate text/icon primary/secondary/muted/disabled/placeholder roles |
| `colorBorder`                                  | subtle/default/strong/interactive/disabled/divider borders            |
| `colorPrimary*`                                | interactive backgrounds/foreground/border, focus/selection roles      |
| `colorContrast*`                               | inverse background/text/icon/border roles                             |
| `overlayBackdrop`                              | `colorBackgroundBackdrop`                                             |
| `{success,warn,danger,info,help}*`             | corresponding eight-role status contract                              |

The canonical exact-name mapping is stored and tested in the internal Core schema; the user-facing grouping and status formula are provided in the [Color Tokens guide](../core/guides/color-tokens.md). The mapping covers 36 compatibility sources (35 legacy color roots and `overlayBackdrop`) and 74 direct semantic targets. Three additional surface roles (`hover`, `active`, `selected`) are multi-source recipes and therefore are not assigned to a single legacy source.

The new primitive and semantic fields are additive/optional in the public preset type. This preserves source compatibility for existing complete custom presets. Core components were not migrated wholesale: current component aliases continue to work as before, while Phase 2 must use semantic roles with a legacy fallback during the 1.x period.

## Alias graph

Before Phase 1, the canonical preset had no cycles and a maximum depth of three. The primitive bridge increased the permitted logical depth to four. Custom-prefix compatibility from Phase 0 adds canonical/requested namespace hops and is limited to a depth of nine.

The automatic graph validator rejects:

- a reference to an unknown custom property;
- self-reference;
- a direct or transitive cycle;
- a canonical/custom-prefix chain above the agreed limit.

## Public additive changes

`@codemonster-ru/vueforge-theme` exports:

- `vfPrimitiveColorTokenNames`;
- `vfSemanticColorTokenNames`;
- `VfPrimitiveColorTokenName`;
- `VfPrimitiveColorTokens`;
- `VfSemanticColorTokenName`;
- `VfSemanticColorTokens`.

Core re-exports the public name tuples/types. Mapping, count/depth constants, and graph validation helpers remain internal schema/build-test infrastructure. Names are serialized by the existing Phase 0 serializer, including numeric steps (`paletteNeutral1000` → `--vf-palette-neutral-1000`).

The public API was extended only additively. Component props, variants, events, and CSS entry paths were unchanged.

## Changes that may affect appearance

There are no new palette values or component-style migrations. The representation of legacy root values changed: literals now pass through primitive aliases, but computed sRGB values, color-mix recipes, and dark overrides are equivalent to the baseline.

This creates a narrow non-visual compatibility risk only for consumer code that compares raw custom-property declaration strings: for example, `getPropertyValue('--vf-color-primary')` may now return `var(--vf-palette-primary-600)` instead of a HEX literal. Code that uses the variable in CSS or compares the computed rendered color receives the previous value.

Therefore, the expected visual diff is zero. Semantic hover/active tokens currently equal the existing solid material; existing Button/IconButton filters continue to produce the previous rendered states.

## Deprecation candidates for VueForge 2

In Phase 1, candidates are documented only; there are no removals, runtime warnings, or bulk TypeScript `@deprecated` annotations.

- after component migration: all 35 flat legacy `color*` roots;
- Core: `switchTrackHoverBackground`, `tableOfContentsTitleColor`, compatibility-only `shadow`;
- Playground: 20 unused aliases;
- CodeBlock: `--vf-codeblock-action-opacity`;
- Layouts: `--vf-layout-surface-subtle`.

A total of 60 unique clean-v2 candidates were recorded. The previously unreachable `colorPrimaryBorderSoft` is now a compatibility source for `colorInteractivePrimaryBorder`, but remains part of the overall flat-root migration.

## Regression coverage

The added contracts verify:

- exact primitive/semantic/legacy/complete counts;
- order and completeness of canonical name tuples;
- all primitive values;
- eight separate roles for each status family;
- the 36-source / 74-target legacy → semantic mapping and actual direct aliases;
- absence of undefined aliases, cycles, and excessive depth;
- light/dark parity;
- runtime/static exact map;
- full stylesheet and selective `foundation.css + component entry` delivery;
- custom prefix and canonical bridge;
- scoped light/dark and Provider output;
- fallback CSS and package consumer/export surface;
- preservation of resolved legacy palette values.

## Verification

Before the Phase 1 commit, the following were completed:

- `npm test`: passed, 378 Vitest tests across seven packages, Core CSS/export/consumer contracts, and Icons render smoke;
- Core suite: 23 test files / 219 tests, 43 CSS exports and 39 auto-CSS exports, packed Core/Theme consumer type contracts;
- `npm run typecheck`: passed for the entire workspace;
- `npm run lint:all`: ESLint, Stylelint, Prettier, and Markdownlint passed; Markdownlint checked 285 files without errors;
- `npm run build`: passed for all library workspaces; Core full stylesheet — 152.59 kB, gzip 17.58 kB;
- `npm run build:demo`: passed; the documentation/showcase build processed 382 modules;
- runtime/static/root/scoped comparison: identical 952-key maps, including 53 dark overrides; the full stylesheet and `foundation.css + component entry` contain the same theme contract;
- graph contracts: canonical depth 4, custom-prefix depth 9; undefined aliases/cycles/depth overflow are rejected;
- packed declaration smoke confirmed that Core retains the external import from `@codemonster-ru/vueforge-theme`, while a legacy-only custom preset remains type-safe.

Visual smoke was run in real headless Chrome for light/dark modes: eight captures covered Core runtime/fallback, opposing scoped boundaries, CodeBlock, and Playground. Runtime and fallback produced the same computed palette, the legacy `colorPrimary` override continued to affect semantic primary aliases, and 2,410 component nodes rendered without browser/page errors. All eight captures were reviewed manually: no noticeable color/geometry drift, clipping, or skeleton-state capture was found.

## Changed files

### Shared contract

- `packages/theme/src/color-token-contract.ts`
- `packages/theme/src/types.ts`
- `packages/theme/src/index.ts`
- `packages/theme/__tests__/runtime.spec.ts`

### Core schema, preset, and delivery contracts

- `packages/core/src/theme/color-token-schema.ts`
- `packages/core/src/theme/color-token-schema.spec.ts`
- `packages/core/src/theme/default-preset-source.ts`
- `packages/core/src/theme/index.ts`
- `packages/core/src/theme/public.ts`
- `packages/core/src/types/theme.ts`
- `packages/core/src/index.ts`
- `packages/core/src/theme/theme-contract.spec.ts`
- `packages/core/src/theme/theme.spec.ts`
- `packages/core/src/providers/VfThemeProvider.spec.ts`
- `packages/core/src/styles/component-entry-parity.spec.ts`
- `packages/core/build/theme-css-artifacts.ts`
- `packages/core/scripts/smoke-css-export.mjs`
- `packages/core/scripts/smoke-consumer-auto-css.mjs`
- `packages/core/scripts/smoke-theme-types.mjs`
- `packages/core/package.json`
- `packages/core/vite.config.ts`

### Documentation

- `docs/core/guides/color-tokens.md`
- `docs/core/guides/index.md`
- `packages/core/docs/theme-api.md`
- `docs/design-audit/color-audit-report.md`
- `docs/design-audit/color-inventory.md`
- `docs/design-audit/phase-1-report.md`

The Phase 0 report was intentionally unchanged.

## Publication risks and version bump

Core imports new public contract exports from Theme, so Core cannot be published before a compatible Theme. The minimum precise recommendation for Phase 1 is:

1. `@codemonster-ru/vueforge-theme` `1.3.0 → 1.4.0`;
2. Core dependency `@codemonster-ru/vueforge-theme` `^1.3.0 → ^1.4.0`;
3. `@codemonster-ru/vueforge-core` `1.35.1 → 1.36.0`.

If the release includes unpublished Phase 0 changes, the recommended coordinated train also includes Layouts `1.21.0 → 1.22.0`, CodeBlock `3.6.1 → 3.7.0`, Playground Core `1.1.1 → 1.2.0`, and Playground `2.5.1 → 2.6.0`, with dependency floors raised to the versions in this train. Phase 1 itself adds no new API to these four packages.

Package versions and dependency ranges were intentionally unchanged in the architecture commit; they should be updated in one release commit after the coordinated train is approved.

## What remains for Phase 2

- target OKLCH palette and browser/fallback policy;
- independent accessible foreground/solid/hover/active materials;
- migration of Core component states with legacy fallback;
- control-boundary and focus contrast;
- disabled/placeholder/read-only/indeterminate semantics;
- compound-state precedence;
- elimination of color-only cues;
- CodeBlock syntax palette and copy focus;
- automated contrast, keyboard, and screenshot-diff gates.

Phase 1 stops at the architecture/contract boundary and does not implement these changes.
