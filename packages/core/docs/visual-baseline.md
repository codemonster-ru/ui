# VueForge Core Visual Baseline 1.0

This document defines the visual contract for `@codemonster-ru/vueforge-core` `1.0`.

## Principles

- `core` is a foundation layer, not a decorative showcase layer.
- Controls, surfaces, overlays, and feedback elements should feel related.
- Visual changes after `1.0` should be evolutionary, not stylistic rewrites.
- Tokens are the source of truth for size, radius, spacing, and semantic color.

## Canonical Tokens

Primary source: [src/theme/default-preset.ts](../src/theme/default-preset.ts)

CSS fallback baseline: [src/styles/tokens.css](../src/styles/tokens.css)

- Control heights
  - `sm`: `--vf-control-height-sm` (`28px`)
  - `md`: `--vf-control-height-md` (`36px`)
  - `lg`: `--vf-control-height-lg` (`40px`)
- Control typography
  - `sm` / `md` / `lg`: `14px` / `16px` / `18px`
  - Single-line controls use `--vf-control-line-height` so content fits the control-height scale.
- Radius levels
  - `control`: `--vf-radius-control`
  - `control-tight`: `--vf-radius-control-tight`
  - `surface`: `--vf-radius-surface`
  - `overlay`: `--vf-radius-overlay`
- Spacing levels
  - `button`: `--vf-button-padding-*`
  - `field`: `--vf-field-padding-*`
  - `surface`: `--vf-surface-padding`, `--vf-surface-gap`
  - `section`: `--vf-section-padding`, `--vf-section-gap`
  - `overlay`: `--vf-overlay-padding`, `--vf-overlay-gap`

## Component Scale

- `VfButton`, `VfIconButton`, `VfInput`, `VfSelect`, and `VfAvatar` use the `28px` / `36px` / `40px` control scale.
- `VfBadge` and `VfTag` use a smaller label scale and should remain visually lighter than controls.
- `VfCard`, `VfPanel`, `VfAlert`, `VfDialog`, `VfPopover`, `VfDropdown` use the surface or overlay scale.

## Focus Contract

- Interactive controls use:
  - `border-color: var(--vf-color-primary)`
  - `box-shadow: 0 0 0 2px var(--vf-color-focus-ring)`
- Links may be slightly lighter, but should still follow the same ring language.
- Focus should never rely on inconsistent native outlines.

## Surface Contract

- `surface` is the default component plane.
- `surface-muted` is reserved for supportive or grouped regions such as tabs lists and dropdown menus.
- Shadows are not part of the baseline visual language.
- Separation should come from border, radius, spacing, and surface level.

## Typography Rhythm

- Titles use the heading typography layer, typically `--vf-line-height-tight`.
- Body content uses the body typography layer, typically `--vf-text-body-line-height`.
- Components should avoid arbitrary line-height values unless there is a clear reason.

### Prose Escape Hatch

`VfPlayground` (`.vf-playground`) and `VfCodeBlock` (`.vf-codeblock`) are excluded automatically.
Use `.vf-prose-exclude` for any other embedded UI block that should keep its own typography inside a prose stream.

```vue
<article class="vf-prose">
  <h2>Install</h2>
  <p>Use the playground below to validate your setup.</p>

  <div class="vf-prose-exclude">
    <VfPlayground :files="files" entry="main.ts" />
  </div>

  <p>After the sandbox works, continue with runtime integration.</p>
</article>
```

- Prose typography is skipped for descendants of `.vf-prose-exclude`.
- Vertical rhythm between neighboring prose blocks is preserved.

## Semantic Color Contract

- `primary`, `success`, and `danger` use semantic tokens.
- Feedback colors should not be hardcoded in component styles.
- Soft fills and softened borders should come from tokenized mixes.

## Freeze Rules

- Do not introduce new radius or height values without a system reason.
- Prefer updating tokens over component-local magic numbers.
- New components must reuse existing focus, spacing, and surface language.
