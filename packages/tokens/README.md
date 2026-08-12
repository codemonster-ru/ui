# CodeMonster UI Tokens

Framework-independent design tokens and theme serialization for CodeMonster UI.

## Status

This package owns the CodeMonster UI primitive color palette, light/dark semantic color roles,
spacing and shared sizing scales, typography foundation, border widths, radii, shadows, and motion
values, breakpoints, and the default light and dark theme presets. Generated CSS and serialization
APIs are added by their dedicated roadmap items.

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

## License

[MIT](./LICENSE)
