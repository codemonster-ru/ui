---
title: 'Color Tokens'
description: 'OKLCH primitives, semantic color roles, accessibility pairings, and VueForge 1.x compatibility'
order: 2
---

# Color Tokens

VueForge separates material values from interface decisions:

```text
OKLCH primitive material
  └─ semantic role (background, text, border, interaction, status)
       └─ VueForge 1.x component compatibility token
            └─ component CSS
```

Semantic roles are the supported interface between components and the color system. Primitive variables are for theme
construction, documentation, and explicitly documented adapters such as syntax highlighting. Legacy roots and component
tokens remain available throughout VueForge 1.x so existing presets and local overrides do not silently stop working.

The built-in preset has 997 keys: 847 legacy keys, 66 primitive colors, and 84 additive semantic keys.
`colorFocusRing` already belonged to the 1.x surface and is also one of the 85 semantic roles.

## Naming

- Primitive: `palette{Family}{Step}`, for example `palettePrimary600` / `--vf-palette-primary-600`.
- Shared role: `color{Category}{Role}`, for example `colorTextSecondary` / `--vf-color-text-secondary`.
- Status role: `colorStatus{Tone}{Role}`, for example `colorStatusDangerSubtleForeground`.
- Component adapter exception: a scoped CSS role such as `--vf-codeblock-syntax-token-comment`.
- New names use `Warning`; the public VueForge 1.x `Warn` spelling remains supported.

Names describe purpose rather than hue. Components must not select `palettePrimary600` directly because the appropriate
material changes by role and mode.

## Primitive palette

OKLCH is the authoring format. The sRGB values below are reference conversions for review and diagnostics; the CSS tokens
retain their OKLCH definitions. All shipped colors are inside the sRGB gamut.

### Neutral

Neutral uses hue `260` with deliberately restrained chroma. It provides depth without pure white, pure black, or a visibly
blue cast.

| Step | OKLCH                    | sRGB reference | Main use                                       |
| ---: | ------------------------ | -------------- | ---------------------------------------------- |
|    0 | `oklch(99.5% 0.002 260)` | `#fdfdff`      | light surface, light on-solid                  |
|   50 | `oklch(97.8% 0.005 260)` | `#f6f8fb`      | light canvas                                   |
|  100 | `oklch(95.8% 0.007 260)` | `#eef1f6`      | light subtle, hover, disabled                  |
|  200 | `oklch(90% 0.012 260)`   | `#d9dee6`      | light subtle border/divider, dark primary text |
|  250 | `oklch(84% 0.016 260)`   | `#c5cbd5`      | light default border                           |
|  300 | `oklch(74.5% 0.020 260)` | `#a5adb9`      | dark secondary text                            |
|  400 | `oklch(65% 0.026 260)`   | `#86909f`      | light interactive border, dark muted text      |
|  500 | `oklch(55% 0.032 260)`   | `#677285`      | light muted text, dark interactive border      |
|  600 | `oklch(48.8% 0.030 260)` | `#566071`      | light secondary text, dark default border      |
|  700 | `oklch(40.5% 0.025 260)` | `#414957`      | dark subtle border/divider                     |
|  750 | `oklch(33% 0.020 260)`   | `#2f3640`      | dark elevated/active surface                   |
|  800 | `oklch(29% 0.018 260)`   | `#262c34`      | dark subtle/hover surface                      |
|  850 | `oklch(25.6% 0.014 260)` | `#1f232a`      | light primary text, dark surface               |
|  900 | `oklch(21.4% 0.010 260)` | `#17191e`      | dark canvas                                    |
|  950 | `oklch(16.5% 0.008 260)` | `#0c0e12`      | dark on-bright/inverse text                    |
| 1000 | `oklch(11.5% 0.006 260)` | `#040507`      | backdrop and shadow material                   |

### Chromatic scales

The progression is manually tuned: chroma rises through the useful middle steps, then falls at both ends so subtle and
deep surfaces do not look fluorescent or dirty.

| Family  | Hue | Steps (`lightness/chroma`)                                                                                                                        |
| ------- | --: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary | 247 | `100 95.5/.020`, `200 89/.050`, `300 76/.110`, `400 65/.140`, `500 55.7/.144`, `600 50/.130`, `700 45/.115`, `800 38.5/.090`, `900 30.5/.055`     |
| Success | 148 | `100 95.5/.020`, `300 79/.125`, `400 68/.145`, `500 59/.135`, `600 51.5/.115`, `700 45.5/.105`, `800 38.5/.080`, `900 30.5/.040`                  |
| Info    | 230 | `100 95.5/.018`, `300 78.5/.105`, `400 68/.130`, `500 60/.118`, `600 52.5/.103`, `700 46.5/.091`, `800 39.5/.075`, `900 30.5/.038`                |
| Warning |  88 | `100 96/.035`, `300 81.5/.115`, `400 76/.130`, `500 68.5/.125`, `600 61.5/.115`, `700 54/.105`, `800 47.5/.095`, `900 31.5/.035`, `950 21.5/.043` |
| Danger  |  20 | `100 95.5/.020`, `300 76/.142`, `400 66.5/.180`, `500 60.5/.180`, `600 53.5/.170`, `700 47.5/.150`, `800 40.5/.120`, `900 30/.050`                |
| Help    | 307 | `100 95.5/.020`, `300 77/.115`, `400 67/.145`, `500 60/.150`, `600 52/.130`, `700 44.5/.115`, `800 38/.090`, `900 29.5/.045`                      |

`help` stays distinct from `info`: it is a public violet tone used for contextual assistance across actions, feedback, and
progress components. Removing or aliasing it would be a breaking visual and semantic change.

## Semantic roles

### Surfaces

| Role                   | Light             | Dark              |
| ---------------------- | ----------------- | ----------------- |
| canvas                 | Neutral 50        | Neutral 900       |
| surface                | Neutral 0         | Neutral 850       |
| surface subtle         | Neutral 100       | Neutral 800       |
| surface elevated       | Neutral 0         | Neutral 750       |
| hover                  | Neutral 100       | Neutral 800       |
| active                 | Neutral 200       | Neutral 750       |
| selected               | Primary 100       | Primary 900       |
| selected + hover       | Primary 200       | Primary 800       |
| selected + active      | Primary 300       | Primary 700       |
| disabled               | Neutral 100       | Neutral 800       |
| inverse                | Neutral 850       | Neutral 200       |
| inverse hover / active | Neutral 800 / 750 | Neutral 300 / 400 |

Hover, active, and selected colors are opaque materials. Their result does not change when a component moves between
canvas, surface, and elevated containers. Backdrop and shadow remain transparent because their purpose is composition.

### Text, icons, and borders

| Role group                          | Light              | Dark               |
| ----------------------------------- | ------------------ | ------------------ |
| text primary / secondary / muted    | N850 / N600 / N500 | N200 / N300 / N400 |
| text disabled / placeholder         | N400 / N500        | N500 / N400        |
| icon primary / secondary / disabled | N850 / N600 / N400 | N200 / N300 / N500 |
| border subtle / default             | N200 / N250        | N700 / N600        |
| border strong / interactive         | N400 / N400        | N500 / N500        |
| border disabled / divider           | N200 / N200        | N700 / N700        |
| focus border / ring                 | P600 / P600        | P300 / P300        |
| link default / hover / active       | P700 / P800 / P900 | P300 / P200 / P400 |

Decorative borders are intentionally quieter than interactive control boundaries. Do not use `colorBorderSubtle` for an
input, checkbox, or another control whose boundary is the only indication of affordance.

### Primary interaction

| Role                   | Light              | Dark               |
| ---------------------- | ------------------ | ------------------ |
| solid / hover / active | P600 / P700 / P800 | P500 / P600 / P700 |
| solid foreground       | N0                 | N0                 |
| subtle background      | P100               | P900               |
| subtle foreground      | P700               | P300               |
| border                 | P500               | P400               |
| selected foreground    | P800               | P200               |

The dark solid starts one step lighter so its boundary reaches 3:1 against the dark surface while its white label remains
above 4.5:1.

### Status model

Every `Success`, `Warning`, `Danger`, `Info`, and `Help` family has eight independent roles:

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

| Material                   | Light                        | Dark                     |
| -------------------------- | ---------------------------- | ------------------------ |
| solid                      | 600; warning 400             | 500                      |
| on-solid                   | Neutral 0; warning 950       | Neutral 950; warning 950 |
| hover / active             | 700 / 800; warning 500 / 600 | 400 / 300                |
| subtle                     | 100                          | 900                      |
| subtle foreground and icon | 700; warning 800             | 300                      |
| border                     | 500; warning 700             | 400                      |

Warning deliberately uses separate solid and subtle foreground materials. One status token must never serve as both a
solid background and subtle text merely because both belong to the same hue family.

## Supported contrast pairings

CI validates the combinations components are allowed to render. It does not test a Cartesian product of unrelated colors.

| Pairing                                        | Light |  Dark | Requirement |
| ---------------------------------------------- | ----: | ----: | ----------: |
| primary text / surface                         | 15.50 | 11.67 |         4.5 |
| secondary text / surface                       |  6.23 |  6.94 |         4.5 |
| muted text / canvas                            |  4.55 |  5.43 |         4.5 |
| interactive border / surface                   |  3.19 |  3.24 |         3.0 |
| interactive border / canvas                    |  3.03 |  3.62 |         3.0 |
| focus ring / surface                           |  5.89 |  7.39 |         3.0 |
| primary solid / on-solid                       |  5.89 |  4.62 |         4.5 |
| primary solid / surface                        |  5.89 |  3.35 |         3.0 |
| selected foreground / strongest selected state |  4.59 |  5.35 |         4.5 |
| status solid / on-solid, minimum               |  5.19 |  4.55 |         4.5 |
| status subtle foreground / background, minimum |  5.98 |  6.10 |         4.5 |
| status border / subtle background, minimum     |  3.38 |  4.19 |         3.0 |

The complete machine-supported matrix is intentionally finite. “Chromatic subtle” below means the primary subtle surface,
all five status subtle surfaces, and the inverse-subtle surface used by Alert/Badge variants.

| Foreground or indicator role         | Allowed background/material roles                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| primary text                         | canvas, surface, elevated, neutral/chromatic subtle, and CodeBlock selected-active        |
| secondary text                       | canvas, surface, elevated, and neutral/chromatic subtle                                   |
| muted text                           | canvas and surface                                                                        |
| placeholder text                     | surface                                                                                   |
| inverse text                         | inverse, inverse hover, and inverse active                                                |
| link default, hover, or active       | canvas and surface; default link also on CodeBlock neutral-subtle                         |
| primary solid foreground             | primary solid, hover, and active                                                          |
| primary subtle foreground            | primary subtle and neutral-subtle                                                         |
| selected foreground                  | selected, selected hover, and selected active                                             |
| primary icon                         | canvas, surface, elevated, neutral/inverse subtle, and the disabled progress track        |
| secondary icon                       | surface, elevated, and the disabled progress track                                        |
| inverse icon                         | inverse, inverse hover, and inverse active                                                |
| strong or focus border               | surface; focus border also on canvas                                                      |
| interactive border                   | canvas and surface                                                                        |
| primary interactive border           | canvas, surface, neutral-subtle, and primary subtle                                       |
| focus ring                           | canvas, surface, and neutral-subtle                                                       |
| inverse border                       | inverse-subtle and neutral-subtle                                                         |
| primary solid or inverse background  | disabled progress track; primary solid also on canvas and surface                         |
| each status solid foreground         | the same status solid, hover, and active                                                  |
| each status subtle foreground        | the same status subtle and neutral-subtle; danger also on canvas/surface field containers |
| each status icon                     | the same status subtle and disabled progress track                                        |
| each status border                   | the same status subtle and neutral-subtle; danger also on canvas/surface field containers |
| neutral ProgressBar label            | inverse text against the secondary-icon value material                                    |
| CodeBlock selected-active background | neutral-subtle editor surface at `1.5:1`; primary selection text at `4.5:1`               |

Using a role outside this matrix is not automatically inaccessible, but it is not a supported pairing until its real
component scenario, minimum ratio, both modes, and regression coverage are added together.

Disabled controls are exempt from the WCAG contrast success criteria, but VueForge still assigns an explicit disabled text,
surface, border, and cursor treatment. Do not apply a second opacity reduction to already-disabled semantic colors.

### Interactive state precedence

State color is resolved in this order:

1. disabled suppresses hover and active styling and uses dedicated disabled roles;
2. invalid adds the danger boundary above checked/open styling; binary controls retain their checkmark and selected fill,
   while Select suppresses its normal open border, and focus remains visible as an added ring;
3. selected or checked establishes the base material;
4. selected + hover and selected + active use their dedicated opaque roles;
5. hover and active apply only when no higher-priority compound state replaces them;
6. focus-visible adds the focus ring without erasing selected, checked, open, or invalid meaning;
7. read-only uses the subtle surface treatment, except that invalid remains visually invalid.

`VfSwitch static` is an interactive visual variant, not a disabled or read-only state. It keeps hover and focus cues while
holding the track on its static background recipe.

This is why selected materials are independent values rather than opacity overlays. The same state produces a stable color
on canvas, surface, and elevated containers.

## Component policy

Use the narrowest shared semantic role that describes the decision:

```css
.product-card {
  color: var(--vf-color-text-primary);
  background: var(--vf-color-background-surface);
  border-color: var(--vf-color-border-default);
}

.product-card:hover {
  background: var(--vf-color-background-surface-hover);
}
```

Primitive use inside component CSS is prohibited. A component-specific token is appropriate only when shared semantics
cannot express the decision. CodeBlock syntax roles and a composited overlay shadow are valid examples; a mechanical
`buttonLabelColor → colorTextPrimary` alias is not a reason to expand the public API.

The hardcoded-color contract scans component CSS under every workspace package `src` directory. HEX, functional color
literals, and named colors are rejected. Its general allowlist is limited to `transparent` and `currentColor`, whose values
depend on composition or inheritance rather than a palette choice. The only literal-value allowlist contains six exact
OKLCH fallbacks in `packages/codeblock/src/tokens.css`; they keep standalone CodeBlock readable before Core CSS loads.
Authoritative OKLCH literals live in the theme schema, while CodeBlock theme tests require the matching lazy Shiki
fallbacks to stay in gamut, above the supported contrast minimum, and aligned with the editor surface. Playground's
sandbox bridge separately permits the platform colors `Canvas` and `CanvasText` only as the final fallback inside generated
iframe HTML; custom-prefix and sandbox tests pin those two exceptions. The component-mapping primitive allowlist contains
one composited recipe: `overlayFloatShadow` may use Neutral 1000 at two documented alpha levels. A contract asserts that no
other component mapping references a primitive directly.

During VueForge 1.x, existing component tokens remain the customization boundary:

```text
component CSS → --vf-input-border-color
--vf-input-border-color → --vf-color-border-interactive → legacy fallback
```

This keeps an existing `extend: { inputBorderColor: ... }` or manual `--vf-input-border-color` override effective while the
built-in default is governed by the semantic layer. Simple compatibility aliases are candidates for removal only in
VueForge 2.

One-token component overrides continue to control their base state, but they cannot define the new compound-state model.
For example, `--vf-tabs-tab-active-background` remains the selected fallback, while selected + hover and selected + active
use their dedicated semantic roles. A custom theme that changes the entire selected recipe must override all three roles;
otherwise the built-in compound states intentionally remain accessible and mode-aware.

## Custom theme migration

Primitive and semantic fields remain optional additions to `VfThemeTokens`, so a complete VueForge 1.x preset without them
continues to type-check. Migrated CSS includes a legacy fallback for that case.

For new or updated themes:

1. Override semantic roles for decisions, not primitives in component CSS.
2. Override `colorInteractivePrimaryBackground` separately from `colorSelectedForeground`.
3. Supply independent status solid, subtle foreground, border, hover, and active roles.
4. Test both root and nested scoped light/dark themes.
5. If a custom prefix is used, generate CSS through the VueForge runtime or static builder so canonical `--vf-*` aliases are
   emitted.

The public `buttonSolidHoverFilter` and `buttonSolidActiveFilter` hooks remain available for VueForge 1.x compatibility,
but their built-in values are now `none`. A copied 1.x theme that still supplies `brightness(...)` will apply that filter on
top of the new independent semantic hover or active material. Set both filters to `none` when adopting the Phase 2 state
roles, or keep them deliberately and review the compounded result.

The unavoidable VueForge 1.x behavior change is the removal of overloaded legacy meaning. Previously, changing only
`colorDanger` also changed danger subtle text, icon, hover, and active because all roles pointed to one root. It now controls
the compatible solid material; override the corresponding semantic roles when the whole danger scale is customized.

Legacy tokens are not removed or renamed. `colorWarn*` remains available even though new semantic names use `Warning`.

## Browser support

The built-in palette uses `oklch()` and the compatibility layer already uses `color-mix()`. Consumers must target browsers
that support modern CSS Color syntax. VueForge does not emit a second sRGB declaration for every runtime-generated custom
property because doing so would make runtime, static, scoped, and custom-prefix serialization diverge. The reference sRGB
values above can be used by custom presets that intentionally support an older browser matrix.

## Adding a color token

Add a primitive only when a real semantic scenario cannot use an existing step. Add a semantic role only when it is shared,
mode-aware, and has a distinct contrast or state requirement. Every addition must update:

- the canonical Theme name tuple and public type;
- the built-in light and dark maps;
- runtime/static/scoped/custom-prefix parity fixtures;
- alias graph and cycle validation;
- supported contrast pairings;
- component-entry/full stylesheet contracts;
- this guide and the color-system showcase.
