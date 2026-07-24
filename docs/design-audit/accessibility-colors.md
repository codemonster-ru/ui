# VueForge: color accessibility audit

> **Historical baseline.** The ratios and findings below apply to the pre-Phase 2 palette and are retained for
> before/after comparison. The current remediation matrix is provided in the [Phase 2 report](./phase-2-report.md).

Audit date: 2026-07-21. Status: **contrast baseline retained; Phase 0 did not change the palette**.

This document records the results of a read-only review of the original VueForge preset. Phase 0 eliminated transport/scoping/fallback drift but did not change any palette token value, Shiki theme, or contrast recipe. Therefore, all numerical results and accessibility findings below remain current and unresolved. Technical results are provided in the [Phase 0 report](./phase-0-report.md).

## Methodology

- Contrast was calculated using sRGB relative luminance and the WCAG 2.2 formula.
- Opaque `color-mix(in srgb, ...)` values were reduced to the actual resulting sRGB color.
- Normal text was checked against 4.5:1; large text and meaningful graphical/interactive boundaries were checked against 3:1.
- Disabled content may formally be exempt from some WCAG requirements, but it was checked for readability and the risk of appearing active.
- Results were compared with computed styles and actual showcase rendering in Chrome, in light/dark modes at widths of 1440 and 390 px.
- For translucent states, the result depends on the underlying surface. Tables use the preset's standard surface; custom surfaces require recalculation.

Palette sources: `packages/core/src/theme/default-preset-source.ts:512-546,867-903`.

## Key combinations

| Combination                              |      Light |       Dark |                              Requirement | Status                            | Main consumers                             |
| ---------------------------------------- | ---------: | ---------: | ---------------------------------------: | --------------------------------- | ------------------------------------------ |
| Primary text / surface                   |    15.75:1 |    10.61:1 |                                    4.5:1 | Pass                              | body, headings, inputs, alerts             |
| Primary text / page background           |    14.80:1 |    11.86:1 |                                    4.5:1 | Pass                              | page copy                                  |
| Muted / surface                          |     5.68:1 |     6.00:1 |                                    4.5:1 | Pass                              | descriptions, inactive navigation          |
| Muted / page background                  |     5.34:1 |     6.71:1 |                                    4.5:1 | Pass                              | secondary page copy                        |
| Placeholder/disabled / muted surface     |     5.12:1 |     5.42:1 |                           4.5:1 for text | Passes contrast; overloaded role  | fields, disabled, loading                  |
| Primary foreground / surface             |     6.40:1 | **2.92:1** |                                    4.5:1 | **Dark fail**                     | links, selected labels, current navigation |
| Danger foreground / surface              |     5.41:1 | **2.99:1** |                                    4.5:1 | **Dark fail**                     | error messages, invalid labels             |
| Help foreground / surface                |     7.03:1 | **2.48:1** |                                    4.5:1 | **Dark fail**                     | help status text/icons                     |
| Warning foreground / surface             | **3.60:1** |     5.85:1 |                                    4.5:1 | **Light fail**                    | warning Tag/text                           |
| Default border / surface                 | **1.36:1** | **1.40:1** | 3:1 if the boundary identifies a control | **Fail**                          | inputs, unchecked controls, dividers       |
| Field hover border / surface             | **1.91:1** | **2.17:1** |                                      3:1 | **Fail**                          | Input, Textarea, Select                    |
| Focus ring / surface                     | **1.65:1** | **1.52:1** |                                      3:1 | **Fail**                          | almost all interactive components          |
| Primary selected text / 20% primary-soft |     4.73:1 | **2.42:1** |                                    4.5:1 | **Dark fail**                     | Select option, navigation states           |
| Surface / canvas                         |     1.06:1 |     1.12:1 |                     informational metric | Very weak hierarchy               | cards, panels, docs layout                 |
| Surface-muted / canvas                   |     1.04:1 |     1.24:1 |                     informational metric | Nearly indistinguishable in light | code, headers, nested surfaces             |

### Why one semantic status color cannot work everywhere

In the dark theme, the current chromatic token is used simultaneously as:

1. foreground on `#20232a`;
2. a solid background with white text.

For AA with white text, the solid color's relative luminance must not exceed `0.1833`. For the same color to meet AA as text on `#20232a`, it must be at least `0.2504`. The ranges do not overlap. Therefore, the problem cannot be fixed with a single “lighter” or “darker” shade: the `foreground` and `solid` roles must be separated.

## Solid semantic backgrounds

Current solid buttons with contrast text pass AA. This must be preserved during migration.

| Tone                    |   Light |    Dark | Status |
| ----------------------- | ------: | ------: | ------ |
| Primary / white         |  6.40:1 |  5.39:1 | Pass   |
| Success / white         |  5.13:1 |  5.36:1 | Pass   |
| Info / white            |  5.04:1 |  5.25:1 | Pass   |
| Warning / dark on-solid |  5.07:1 |  6.79:1 | Pass   |
| Help / white            |  7.03:1 |  6.33:1 | Pass   |
| Danger / white          |  5.41:1 |  5.25:1 | Pass   |
| Contrast / inverse      | 15.31:1 | 12.33:1 | Pass   |

Conclusion: the current base status cannot be replaced with a single new foreground color because that would break solid actions. Separate `solid` and `on-solid` roles are required.

## Status foreground on a soft background

Badge uses normal text at approximately 0.875rem, so the 4.5:1 threshold applies. Alert icons require at least 3:1 as meaningful graphics.

| Tone     |      Light |       Dark | Current status     |
| -------- | ---------: | ---------: | ------------------ |
| Primary  |     5.34:1 | **2.62:1** | Dark fail          |
| Success  | **4.36:1** | **2.64:1** | Fail               |
| Info     | **4.28:1** | **2.68:1** | Fail               |
| Warning  | **3.16:1** |     4.83:1 | Light text failure |
| Help     |     5.85:1 | **2.27:1** | Dark fail          |
| Danger   |     4.50:1 | **2.75:1** | Dark fail          |
| Contrast |    12.61:1 |     8.54:1 | Pass               |

Affected areas include Badge, Tag, Alert icons, Select options, the Stepper current marker, ProgressBar, ProgressSpinner, and some navigation states.

## Syntax highlighting

CodeBlock uses Shiki's `github-light`/`github-dark` themes and emits their colors inline, but obtains its background from VueForge. The highlighting palette was therefore tested against the actual `surface-muted`, not the GitHub background.

| Theme and role     | Foreground | Background |   Contrast | Status |
| ------------------ | ---------- | ---------- | ---------: | ------ |
| Light orange token | `#e36209`  | `#f3f3f3`  | **3.15:1** | Fail   |
| Light red token    | `#d73a49`  | `#f3f3f3`  | **4.12:1** | Fail   |
| Light green token  | `#22863a`  | `#f3f3f3`  | **4.17:1** | Fail   |
| Light comment      | `#6a737d`  | `#f3f3f3`  | **4.34:1** | Fail   |
| Dark comment       | `#6a737d`  | `#272b33`  | **2.95:1** | Fail   |

Source: `packages/codeblock/src/services/code-highlight.ts:21-27,196-218`. A VueForge-specific Shiki theme or semantic syntax palette calculated with the actual background is required.

## Focus and interactive boundaries

### Focus

`--vf-color-focus-ring` is composed as 32% primary over the surface in light mode and 42% in dark mode. At 3 px wide the ring is geometrically visible, but its contrast is 1.65:1/1.52:1. Visual review with forced `:focus-visible` confirmed that the ring nearly disappears against the surface.

Affected components include Button, IconButton, Link, Input, Textarea, Select, Checkbox, Radio, Switch, Tabs, menus, Stepper, overlay items, HorizontalScroller, and ThemeSwitch.

A separate defect: after `all: unset`, `.vf-codeblock__copy` receives neither an outline nor a box-shadow; focus-visible changes only the color of the small icon (`packages/codeblock/src/codeblock.css:56-87,115-124`).

### Control boundaries

One `colorBorder` is used both as a decorative divider and as the only control outline. Low contrast is acceptable for a decorative separator, but not for Input, Select, or unchecked Checkbox/Radio/Switch controls. At minimum, separate `border.subtle` and `border.control` roles are required.

## Component states

| Group             | Confirmed issue                                                         | Recommended role/fix                                |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Links/prose       | Dark primary 2.92:1; no independent active/visited/disabled states      | `link.default/hover/active/visited/focus`           |
| Fields            | Boundary and hover below 3:1; danger supporting text is 2.99:1 in dark  | `border.control`, `status.danger.foreground`        |
| Select            | invalid+open is overwritten by primary; dark selected is 2.42:1         | Formal state precedence + status/selection roles    |
| Checkbox/Radio    | Unchecked boundary below 3:1; invalid may be conveyed only by color     | Strong boundary + message/icon cue                  |
| Switch            | Invalid is lost on checked-hover/focus; primary graphic weak in dark    | Precedence + `primary.graphic`                      |
| Tabs              | Dark indicator 2.92:1; disabled receives double attenuation             | `selection.indicator`, remove double opacity        |
| Badge/Tag         | Semantic small text fails; tone is conveyed only by color               | Status foreground + optional icon/label contract    |
| Alert             | Body readable, status icon weak; hideIcon leaves color as the only cue  | `status.graphic`, retain the only non-color cue     |
| Progress/Spinner  | Dark semantic strokes near/below 3:1                                    | `status.graphic` with a 3:1 minimum                 |
| Stepper           | Current marker weak; nested opacity multiplies                          | Selection/status graphic + unified disabled formula |
| Menu/Nav/Dropdown | Current/active often rely on dark primary; disabled branches incomplete | Selection foreground/indicator + disabled semantics |
| Card/Panel/Table  | Surface/border hierarchy 1.04–1.40:1                                    | Subtle/default/elevated layers; separate controls   |
| CodeBlock         | Syntax failures; copy focus absent                                      | Syntax roles + shared focus contract                |

## Color as the only signal

The following systematically depend on hue without a guaranteed secondary cue:

- invalid controls without supporting error text/icon;
- Badge and Tag tone;
- ProgressBar and ProgressSpinner tone;
- default active item Dropdown;
- Alert tone with `hideIcon`.

Alert uses distinct icons by default, which is a good non-color cue. Checked controls, selected Tabs, Stepper, and active navigation also use shape, position, weight, or an indicator, but their graphical contrast still needs correction.

For protanopia/deuteranopia, the distinction between success green and danger red cannot be relied upon. For tritanopia, blue/yellow alone cannot be relied upon. In the target system, status must be reinforced by text, icon shape, or structure. For achromatopsia, the state must remain understandable from lightness/shape without hue.

## Disabled, opacity, and motion

- `colorMuted` simultaneously serves secondary, placeholder, and disabled roles. This prevents independent tuning of readability and inactive hierarchy.
- Button, CodeBlock, Tabs, Stepper, and breadcrumbs apply opacity to an entire subtree; the result depends on the unknown background.
- Tabs first mixes the disabled foreground to 50%, then applies another `opacity: .5`.
- Stepper applies opacity to both the trigger and descendants, effectively multiplying it.
- Disabled content should not be made artificially higher contrast than active content. A separate `fg.disabled` plus explicit disabled behavior/cursor is recommended, without cascading opacity.
- `prefers-reduced-motion` currently covers only striped ProgressBar; spinner, skeleton, indeterminate progress, and theme transitions require a shared policy. This is not a color-contrast defect, but it affects safe perception of states.

## Target guarantees

After the palette is agreed, automated checks must guarantee:

1. normal foreground on every permitted surface is at least 4.5:1;
2. status foreground on status subtle is at least 4.5:1;
3. focus indicators and control boundaries are at least 3:1 against adjacent colors;
4. meaningful status/selection graphics are at least 3:1;
5. `on-solid` for every tone is at least 4.5:1;
6. every syntax foreground on the actual code background is at least 4.5:1;
7. root light/local dark and root dark/local light pass the same matrix;
8. states remain understandable in grayscale and without red/green differentiation.

## Automation gap after Phase 0

Phase 0 added exhaustive token/static/runtime parity, full/component-entry parity, nested scoped-theme tests, and manual light/dark browser smoke tests for fallback, CodeBlock, and the Playground iframe. These checks ensure delivery of the correct variables, but do not calculate resulting colors, contrast, focus rendering, or screenshot-diff parity. CI still lacks Axe, browser contrast assertions, and visual regression. The literal-color regex also does not cover `oklch()`, `lab()`, `lch()`, `color()`, all named colors, or arbitrary color functions.

Lightweight checks are needed without substantial new infrastructure:

- a shared JS module for WCAG calculation and semantic-pair fixtures;
- browser smoke tests for computed styles in both themes;
- keyboard focus assertions;
- light/dark screenshots at 1440 and 390 px;
- an automated fallback-only browser case without the runtime plugin;
- a permanent browser gate for scoped/nested theme and iframe cases;
- forced-colors smoke.
