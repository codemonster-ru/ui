---
title: 'Color Tokens'
description: 'Primitive, semantic, and legacy-compatible color theming'
order: 2
---

# Color Tokens

VueForge separates color decisions into three layers while keeping the complete VueForge 1.x token surface available. During the 1.x transition, current components and the new semantic contract meet at the compatibility roots:

```text
current 1.x component aliases ───────────┐
                                        ├─→ legacy color roots ─→ 29 primitives
77 new semantic roles ──────────────────┘

Phase 2 target: component decisions ─→ semantic roles
```

The built-in preset contains 952 keys: all 847 existing keys, 29 new primitives, and 76 new semantic keys. `colorFocusRing` already belonged to the 1.x contract and is also one of the 77 semantic roles.

Phase 1 changes the architecture, not the visual palette. Existing HEX values, color-mix recipes, component styles, and public component APIs are preserved. Core components continue to consume their 1.x aliases until their deliberate state migration in Phase 2.

## Naming Convention

- Primitive material: `palette{Family}{Step}`, for example `paletteNeutral500` / `--vf-palette-neutral-500`.
- Shared semantic role: `color{Category}{Role}`, for example `colorTextSecondary` / `--vf-color-text-secondary`.
- Status role: `colorStatus{Tone}{Role}`, for example `colorStatusDangerSubtleBackground`.
- Component exception: `{component}{Role}`, for example `alertPrimarySoft`.
- Names describe purpose. Do not add `blue`, `darkGray`, or another material name to the semantic layer.
- Use `Warning` in new semantic names. The legacy `Warn` spelling remains supported for VueForge 1.x.

## Primitive Palette

The primitive layer contains only material values that the current themes actually use. Sparse steps are intentional: Phase 1 does not invent interpolation stops or replace the palette with OKLCH values.

| Family  | Tokens and current sRGB values                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neutral | `0 #ffffff`, `50 #f6f8fb`, `100 #f3f3f3`, `200 #d9dde3`, `250 #d7d7d7`, `300 #d4d4d4`, `400 #9da0a6`, `500 #616773`, `600 #363b46`, `700 #272b33`, `750 #252526`, `800 #20232a`, `850 #1f232b`, `900 #17191e`, `950 #111827`, `1000 #000000` |
| Primary | `500 #276cb5`, `600 #0e639c`                                                                                                                                                                                                                 |
| Success | `500 #2e7d32`, `600 #37783e`                                                                                                                                                                                                                 |
| Info    | `500 #0077a3`, `600 #1a739f`                                                                                                                                                                                                                 |
| Warning | `400 #b79a63`, `500 #a1841f`, `950 #1f1300`                                                                                                                                                                                                  |
| Danger  | `500 #bf3f3f`, `600 #c72e39`                                                                                                                                                                                                                 |
| Help    | `500 #7b4c96`, `600 #6e43a2`                                                                                                                                                                                                                 |

The Phase 1 material policy is deliberately conservative:

- lightness: higher neutral steps are darker; chromatic step numbers preserve the approximate ordering of the existing pair, not a newly interpolated scale;
- chroma: existing sRGB chroma is frozen, with no normalization or invented intermediate stops;
- hue: each existing family hue is retained exactly; Phase 1 does not rotate or mathematically regularize hues;
- modes: primitives are mode-independent materials, while legacy/semantic mappings select the appropriate material for light or dark.

The current mode selection is explicit:

| Family  | Light mapping                                                                                | Dark mapping                                                                                    |
| ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Neutral | `50` canvas, `0` surface, `100` subtle, `200` border, `500` muted, `850` text, `750` inverse | `900` canvas, `800` surface, `700` subtle, `600` border, `400` muted, `300` text, `250` inverse |
| Primary | `600`                                                                                        | `500`                                                                                           |
| Success | `500`                                                                                        | `600`                                                                                           |
| Info    | `500`                                                                                        | `600`                                                                                           |
| Warning | `500`; `950` on-solid foreground                                                             | `400`; `950` on-solid foreground                                                                |
| Danger  | `600`                                                                                        | `500`                                                                                           |
| Help    | `600`                                                                                        | `500`                                                                                           |

Neutral `0` remains the white contrast material, neutral `1000` remains the black/backdrop material, and neutral `950` remains the dark inverse foreground. Intermediate neutral stops exist only where the baseline themes already use them.

`help` remains separate from `info`: it is a public violet tone used by Button, IconButton, Badge, Tag, Alert, ProgressBar, ProgressSpinner, and the text utility. Aliasing it to `info` would change both meaning and appearance.

## Semantic Roles

### Background

| Token                            | Current compatibility source   |
| -------------------------------- | ------------------------------ |
| `colorBackgroundCanvas`          | `colorBg`                      |
| `colorBackgroundSurface`         | `colorSurface`                 |
| `colorBackgroundSurfaceSubtle`   | `colorSurfaceMuted`            |
| `colorBackgroundSurfaceElevated` | `colorSurface`                 |
| `colorBackgroundSurfaceHover`    | text 6% mixed into surface     |
| `colorBackgroundSurfaceActive`   | text 10% mixed into surface    |
| `colorBackgroundSurfaceSelected` | primary 20% mixed into surface |
| `colorBackgroundSurfaceDisabled` | `colorSurfaceMuted`            |
| `colorBackgroundInverse`         | `colorContrast`                |
| `colorBackgroundInverseSubtle`   | `colorContrastSoft`            |
| `colorBackgroundBackdrop`        | `overlayBackdrop`              |

### Text and Icons

| Token group                                                                         | Current compatibility source |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| `colorTextPrimary`                                                                  | `colorText`                  |
| `colorTextSecondary`, `colorTextMuted`, `colorTextDisabled`, `colorTextPlaceholder` | `colorMuted`                 |
| `colorTextInverse`                                                                  | `colorContrastContrast`      |
| `colorIconPrimary`                                                                  | `colorText`                  |
| `colorIconSecondary`, `colorIconDisabled`                                           | `colorMuted`                 |
| `colorIconInverse`                                                                  | `colorContrastContrast`      |

The roles intentionally remain separate even when they resolve to the same current value. A future palette may tune disabled, placeholder, secondary, and muted independently without changing their public names.

### Borders

| Token                                                                                                                                 | Current compatibility source |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `colorBorderSubtle`, `colorBorderDefault`, `colorBorderStrong`, `colorBorderInteractive`, `colorBorderDisabled`, `colorBorderDivider` | `colorBorder`                |
| `colorBorderFocus`                                                                                                                    | `colorPrimary`               |
| `colorBorderInverse`                                                                                                                  | `colorContrastBorderSoft`    |

### Interactive

| Token                                     | Current compatibility source    |
| ----------------------------------------- | ------------------------------- |
| `colorInteractivePrimaryBackground`       | `colorPrimary`                  |
| `colorInteractivePrimaryHoverBackground`  | `colorPrimary`                  |
| `colorInteractivePrimaryActiveBackground` | `colorPrimary`                  |
| `colorInteractivePrimarySubtleBackground` | `colorPrimarySoft`              |
| `colorInteractivePrimaryForeground`       | `colorPrimaryContrast`          |
| `colorInteractivePrimaryBorder`           | `colorPrimaryBorderSoft`        |
| `colorFocusRing`                          | existing `colorFocusRing` token |
| `colorSelectedForeground`                 | `colorPrimary`                  |

Hover and active colors intentionally equal the current solid material in Phase 1. Existing components still apply their established hover/active filter effects. Separate roles now exist so those states can receive independently designed values in Phase 2.

### Status

Each of `Success`, `Warning`, `Danger`, `Info`, and `Help` has the same eight-role contract:

```text
colorStatus{Tone}SolidBackground
colorStatus{Tone}SolidForeground
colorStatus{Tone}SubtleBackground
colorStatus{Tone}SubtleForeground
colorStatus{Tone}Border
colorStatus{Tone}Icon
colorStatus{Tone}HoverBackground
colorStatus{Tone}ActiveBackground
```

The compatibility mapping is consistent for every tone:

| Semantic role           | Legacy source                                             |
| ----------------------- | --------------------------------------------------------- |
| Solid background        | base status color, such as `colorDanger`                  |
| Solid foreground        | contrast status color, such as `colorDangerContrast`      |
| Subtle background       | soft status color, such as `colorDangerSoft`              |
| Subtle foreground       | base status color                                         |
| Border                  | border-soft status color, such as `colorDangerBorderSoft` |
| Icon                    | base status color                                         |
| Hover/active background | base status color in Phase 1                              |

A single semantic token must never serve as both foreground and solid background, even when two roles temporarily resolve to the same primitive value.

## Compatibility Bridge

The built-in preset uses a one-way, acyclic bridge. Phase 1 does not insert the semantic layer into existing component chains:

```text
new semantic role ──────────┐
                           ├─→ legacy root → primitive material
current component alias ───┘

Phase 2 component migration: component decision → semantic role
```

This direction is deliberate. An existing VueForge 1.x override such as `colorPrimary` continues to affect semantic aliases that depend on it. Primitive and semantic keys are optional additions to the public preset type, so an existing complete custom preset remains source-compatible.

Do not create the reverse alias for the same pair. For example, defining both `colorPrimary → colorInteractivePrimaryBackground` and `colorInteractivePrimaryBackground → colorPrimary` creates a CSS-variable cycle.

During the migration period:

- override a legacy token when current 1.x components must change together;
- override a semantic token when targeting the new role contract;
- override a component token only for a genuine local exception;
- old custom presets remain valid; components migrated in Phase 2 must provide a legacy fallback until the next major release.

Custom prefixes, runtime generation, static CSS, full stylesheets, scoped themes, and fallback CSS expose the same 952-key built-in contract. Selective static consumers receive that contract through `foundation.css + component entry`; a component entry alone stays isolated and relies on runtime theme injection, as it did before Phase 1.

## Adding Tokens

Add a primitive only when a semantic role needs a material value that does not already exist. Do not fill numeric gaps merely to make a scale look complete.

Add a semantic token when:

- the role is shared by multiple components;
- light and dark themes may need different material mappings;
- the role has a distinct contrast or interaction requirement;
- reusing another role would conflate foreground, background, border, or state meaning.

Add a component token only when shared semantics cannot express the decision. Valid examples include Alert's distinct primary subtle recipe, overlay composition, and CodeBlock syntax adaptation. A mechanical `buttonText → colorTextPrimary` alias is not a reason to expand the public API.

Every addition must update the canonical name tuple, public type, built-in preset, runtime/static parity fixtures, alias graph validation, custom-prefix/scoped-theme contracts, and this guide.

## Migration and Deprecation

No legacy token is removed or renamed in VueForge 1.x. Confirmed VueForge 2 cleanup candidates include the unused `switchTrackHoverBackground` and `tableOfContentsTitleColor`, plus the compatibility-only `shadow` after Layouts and CodeBlock migrate. The previously unreachable `colorPrimaryBorderSoft` now supplies `colorInteractivePrimaryBorder`, but remains part of the broader flat-root migration candidate set.

The complete flat `color*` legacy family is a documented v2 migration candidate after core components consume semantic roles. `colorMuted`, `colorBorder`, base status colors, `colorWarn*`, and `colorContrast*` are especially ambiguous. Deprecation is documentary in Phase 1; there are no runtime warnings or mass TypeScript `@deprecated` annotations.

## What Phase 2 Owns

Phase 2 will migrate component state recipes to the semantic layer, assign independently designed hover/active/foreground values, address control and focus contrast, resolve state precedence, and perform the associated visual/accessibility review. Phase 1 does not introduce the target OKLCH palette or alter current component colors.
