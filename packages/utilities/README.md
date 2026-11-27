# CodeMonster UI utilities

Generated token-backed utility CSS for CodeMonster UI.

This guide covers version `2.0.1`. See the [2.0 release notes](../../docs/codemonster-ui-2.0-release-notes.md)
for release status and matching package versions.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling.
- `@codemonster-ru/ui-tokens@^2.0.0` loaded before the generated utilities.

## Installation

Install from npm.

```bash
npm install @codemonster-ru/ui-tokens@2.0.0 @codemonster-ru/ui-utilities@2.0.1
```

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
@import '@codemonster-ru/ui-utilities/utilities.css';
```

## Quick start

Apply the `cm-` prefixed classes directly to application markup:

```html
<section class="cm-grid cm-grid-cols-2 cm-gap-4 cm-md-grid-cols-3">
  <article class="cm-p-4 cm-rounded-surface cm-bg-surface">Content</article>
</section>
```

The package generates prefixed display, flex, grid, logical spacing, sizing, typography, semantic
color, border, and radius utilities. Mobile-first `sm`, `md`, and `lg` variants are limited to
layout and gap families. Rules live in `@layer cm-utilities` and do not use `!important`.

## Documentation

See the [utility CSS guide](../../docs/css/utilities.md) for the complete generated families,
responsive naming, cascade behavior, limitations, and examples.

## Development

```bash
npm run check
```

## License

[MIT](./LICENSE)
