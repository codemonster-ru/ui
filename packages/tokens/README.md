# CodeMonster UI Tokens

Framework-independent design tokens and theme serialization for CodeMonster UI.

## Status

This package owns the CodeMonster UI primitive color palette, light/dark semantic color roles,
spacing and shared sizing scales, typography foundation, border widths, radii, shadows, and motion
values, breakpoints, the default light and dark theme presets, and their generated CSS custom
properties. Serialization APIs are added by their dedicated roadmap item.

The package does not depend on Vue or another UI framework.

```ts
import {
  cmPrimitiveColorTokenNames,
  cmPrimitiveColorTokens,
  cmSemanticDarkColorTokens,
  cmSemanticLightColorTokens,
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

## License

[MIT](./LICENSE)
