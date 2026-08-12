# CodeMonster UI utilities

Generated token-backed utility CSS for CodeMonster UI.

Current release: `@codemonster-ru/ui-utilities@0.1.0`.

## Installation

```bash
npm install @codemonster-ru/ui-tokens @codemonster-ru/ui-utilities
```

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
@import '@codemonster-ru/ui-utilities/utilities.css';
```

The package generates prefixed display, flex, grid, logical spacing, sizing, typography, semantic
color, border, and radius utilities. Mobile-first `sm`, `md`, and `lg` variants are limited to
layout and gap families. Rules live in `@layer cm-utilities` and do not use `!important`.

See the [utility CSS guide](../../docs/css/utilities.md) for examples, naming, cascade behavior, and
the intentionally excluded families.

## Development

```bash
npm run check
```

## License

[MIT](./LICENSE)
