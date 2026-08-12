# CodeMonster UI Tokens

Framework-independent design tokens and theme serialization for CodeMonster UI.

## Status

This package owns the CodeMonster UI primitive color palette, light/dark semantic color roles,
spacing and shared sizing scales, typography foundation, border widths, radii, shadows, and motion
values, breakpoints, the complete token schema, the default light and dark theme presets, and their
generated CSS custom properties and serialization API.

The package does not depend on Vue or another UI framework.

```ts
import {
  cmPrimitiveColorTokenNames,
  cmPrimitiveColorTokens,
  cmSemanticDarkColorTokens,
  cmSemanticLightColorTokens,
  serializeCmThemeTokensToCssVars,
  type CmPrimitiveColorOverrides,
} from '@codemonster-ru/ui-tokens';

const brandColors: CmPrimitiveColorOverrides = {
  palettePrimary500: 'oklch(58% 0.16 247)',
};

console.log(
  cmPrimitiveColorTokenNames.length,
  cmPrimitiveColorTokens,
  cmSemanticLightColorTokens,
  cmSemanticDarkColorTokens,
  serializeCmThemeTokensToCssVars(brandColors),
  brandColors,
);
```

## Installation

```bash
npm install @codemonster-ru/ui-tokens
```

Import the generated properties once in the application stylesheet:

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
```

The light theme is the default. Set `data-cm-theme="dark"` on the document root to apply the dark
semantic color overrides, or set `data-cm-theme="light"` explicitly.

Consumers that only need the portable breakpoint custom properties can import the smaller entry:

```css
@import '@codemonster-ru/ui-tokens/breakpoints.css';
```

The distributed stylesheet uses ordinary custom properties and does not require custom-media
processing in the consumer build.

## License

[MIT](./LICENSE)
