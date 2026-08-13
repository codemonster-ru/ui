---
title: 'CodeMonster UI tokens'
description: 'Install, theme, override, and serialize framework-independent design tokens'
order: 1
---

# CodeMonster UI tokens

`@codemonster-ru/ui-tokens` provides the framework-independent CodeMonster UI token schema,
light and dark presets, generated CSS custom properties, and a pure TypeScript serializer. It has
no Vue or browser runtime dependency, so the same package can support Vue, server-rendered Razor,
and CSS-only applications.

## Installation

Use the package manager already used by the application:

```bash
npm install @codemonster-ru/ui-tokens
```

```bash
pnpm add @codemonster-ru/ui-tokens
```

```bash
yarn add @codemonster-ru/ui-tokens
```

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
presets remain complete 206-token objects.

### Override tokens

Load application overrides after `tokens.css`. Override primitive tokens to change every semantic
role that references them, or override a semantic token for a narrower responsibility:

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

### Breakpoint entry

Import only the breakpoint properties when the full theme is unnecessary:

```css
@import '@codemonster-ru/ui-tokens/breakpoints.css';
```

This entry defines `--cm-breakpoint-xs` through `--cm-breakpoint-2xl`. CSS custom properties cannot
be used as media-query conditions, so authored and distributed media queries must use the matching
literal widths. The JavaScript registry is the source for build tools that generate those queries.
The distributed package intentionally does not require custom-media processing.

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

Choose `data-cm-theme` before rendering the response when the mode is known. This avoids changing
the mode after first paint. If no attribute is rendered, the light `:root` preset is deterministic.
Razor applications can publish the same CSS artifacts without executing package JavaScript in the
browser.

## Public entries

| Entry                                       | Purpose                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `@codemonster-ru/ui-tokens`                 | Token data, types, schema, presets, breakpoint helpers, and serialization |
| `@codemonster-ru/ui-tokens/tokens.css`      | Complete light/dark custom-property graph plus breakpoints                |
| `@codemonster-ru/ui-tokens/breakpoints.css` | Standalone breakpoint custom properties                                   |
