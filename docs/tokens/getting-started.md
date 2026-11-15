---
title: 'CodeMonster UI tokens'
description: 'Install, theme, override, and serialize framework-independent design tokens'
order: 1
---

# CodeMonster UI tokens

`@codemonster-ru/ui-tokens` provides the framework-independent CodeMonster UI token schema,
light and dark presets, generated CSS custom properties, and a pure TypeScript serializer. It has
no Vue or browser runtime dependency, so the same package can support Vue, server-rendered Vanilla,
and CSS-only applications.

## Installation

For the 2.0 checkout, [pack the workspace and install its local archive](../getting-started.md#install-a-local-20-build).
Applications that use only tokens need the Tokens workspace. Applications that also use shared
components need the matching CSS package.

## CSS consumption

Import the complete stylesheet once, before CodeMonster UI component styles:

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
```

It defines the light preset on `:root` and `[data-cm-theme='light']`. Set the theme attribute on the
document root or on a nested theme boundary:

```html
<html data-cm-theme="dark">
  <!-- application -->
</html>
```

```html
<section data-cm-theme="light">
  <!-- light content inside a dark document -->
</section>
```

The generated dark block contains only values that differ from light. Both exported TypeScript
presets contain the complete token schema.

### Override tokens

Load application overrides after `tokens.css`. Override a primitive at the theme boundary
where the consuming semantic roles are declared. Override a semantic role directly for a
local exception, such as a focus ring inside an embedded app.

```css
:root {
  --cm-palette-primary-500: oklch(58% 0.16 247);
  --cm-color-focus-ring: var(--cm-palette-primary-400);
}

[data-cm-theme='dark'] {
  --cm-color-focus-ring: var(--cm-palette-primary-300);
}
```

Prefer semantic properties in component CSS. Primitive palette properties are theme inputs and
should not become component-level styling contracts.

## Design tokens

Use the shared roles in application compositions so surfaces, controls, and states behave
consistently in both themes. The CSS variables and the typed registry use the same token graph.

| Role | Tokens to start with | Where to use them |
| --- | --- | --- |
| Surfaces | `--cm-color-background-canvas`, `--cm-color-background-surface`, `--cm-color-background-surface-subtle` | Page canvas, content surfaces, quiet inset regions. |
| Text | `--cm-color-text-primary`, `--cm-color-text-secondary`, `--cm-color-text-link` | Body and heading text, supporting text, functional links. |
| Interaction | `--cm-color-border-interactive`, `--cm-color-focus-ring`, `--cm-color-background-surface-selected`, `--cm-color-selected-foreground` | Control boundary, keyboard focus, and the selected surface and text pair. |
| Primary action | `--cm-color-interactive-primary-background`, `--cm-color-interactive-primary-foreground` | Pair the background and text. Use the matching hover and active background roles for interaction. |
| Feedback | `--cm-color-status-danger-subtle-background`, `--cm-color-status-danger-subtle-foreground` and the corresponding Success, Warning, Info, and Help roles | Match the foreground to its solid or subtle surface. Use text or an accessible name to express the status. |
| Disabled | `--cm-color-text-disabled`, `--cm-color-border-disabled` | Pair the visual state with the component's native or documented disabled behavior. |

Typography uses `--cm-font-family-base` and `--cm-font-family-heading` for text and
`--cm-font-family-mono` for code. Scope titles to the page's real heading levels and use
the size, line-height, and weight variables in the `--cm-text-body-*`,
`--cm-text-label-*`, and `--cm-text-caption-*` groups for their corresponding roles.
The [optional Inter stylesheet](../css/getting-started.md#public-entries) loads the font files.

Use the spacing scale for gaps and padding, for example `--cm-space-2` (0.5rem),
`--cm-space-4` (1rem), and `--cm-space-6` (1.5rem). Use component size props or classes
when aligning mixed controls. The shared small, medium, and large height tokens are
1.75rem, 2.25rem, and 2.5rem. Keep content able to wrap or grow with user text settings.

Use `--cm-radius-control`, `--cm-radius-surface`, and `--cm-radius-overlay` for their
respective shapes. `--cm-radius-round` gives a pill or circle when the geometry allows it.
Use `--cm-shadow-surface` for modest elevation and `--cm-shadow-overlay` for a separate
floating layer. Pair elevation with an appropriate surface or border so the boundary
still reads with shadows suppressed.

Shared motion uses 220 ms for fast transitions, 320 ms for normal transitions, and
`--cm-motion-ease-standard` for easing. Keep state changes usable when motion is skipped.
The CSS foundation covers reduced motion and forced colors for library components.
Check custom styles in both modes as well as both themes.

### Breakpoint entry

Import only the breakpoint properties when the full theme is unnecessary:

```css
@import '@codemonster-ru/ui-tokens/breakpoints.css';
```

The thresholds are `xs` 480 px, `sm` 640 px, `md` 768 px, `lg` 1,024 px,
`xl` 1,280 px, and `2xl` 1,536 px. Use the corresponding literal widths in media
conditions. Custom properties such as `--cm-breakpoint-md` are values for declarations or
layout helpers. Use the JavaScript registry for build tools that generate media queries.
Start with flexible layouts that wrap at narrow widths, then add columns as room permits.

## TypeScript consumption

Use the presets as immutable source data and create a new object for application overrides:

```ts
import {
  cmDarkThemePreset,
  cmLightThemePreset,
  serializeCmThemeTokensToCssVars,
  type CmPrimitiveColorOverrides,
  type CmThemeTokens,
} from '@codemonster-ru/ui-tokens';

const brandOverrides: CmPrimitiveColorOverrides = {
  palettePrimary500: 'oklch(58% 0.16 247)',
};

const brandedLightTokens = {
  ...cmLightThemePreset.tokens,
  ...brandOverrides,
} satisfies CmThemeTokens;

const lightCssVariables = serializeCmThemeTokensToCssVars(brandedLightTokens);
const darkCssVariables = serializeCmThemeTokensToCssVars(cmDarkThemePreset.tokens);
```

The serializer returns an immutable map such as
`{ '--cm-palette-primary-500': 'oklch(58% 0.16 247)' }`. It only transforms data and does not access
`window`, `document`, storage, or framework APIs. Applying the map to a DOM element remains an
application or adapter responsibility.

Use `cmThemeTokenSchema` and `cmThemeTokenNames` when tooling needs the canonical group registry or
declaration order. Use `cmBreakpoints` or `resolveCmBreakpoint()` when a build tool needs numeric
breakpoint values.

## Server rendering

Render the chosen `data-cm-theme` on the document root before first paint. An explicit `light` or
`dark` choice overrides the system. Set `system` or omit the attribute for CSS to follow
`prefers-color-scheme`, with light as the fallback. For a nested preview, use an explicit
`light` or `dark` boundary; `system` resolution belongs to the document root.
See the [theme recipe](../recipes/theme-switch.md) for persisting a choice across requests.

## Public entries

| Entry                                       | Purpose                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `@codemonster-ru/ui-tokens`                 | Token data, types, schema, presets, breakpoint helpers, and serialization |
| `@codemonster-ru/ui-tokens/tokens.css`      | Complete light/dark custom-property graph plus breakpoints                |
| `@codemonster-ru/ui-tokens/breakpoints.css` | Standalone breakpoint custom properties                                   |
