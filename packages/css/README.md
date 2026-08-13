# CodeMonster UI CSS

Framework-independent foundation and component styles for CodeMonster UI.

Current prerelease: `@codemonster-ru/ui-css@1.0.0-rc.1`.

## Requirements

- A browser supported by the CodeMonster UI browser policy.
- No JavaScript or UI framework runtime.

## Installation

```bash
npm install @codemonster-ru/ui-css@next
```

## Quick start

```css
@import '@codemonster-ru/ui-css/styles.css';
```

Use the narrower entry when component and primitive styles are not needed:

```css
@import '@codemonster-ru/ui-css/foundation.css';
```

The stylesheet includes a predictable document reset, token-backed document colors and typography,
keyboard-visible focus rings for native controls and `.cm-focus-ring`, and reduced-motion and
forced-colors foundations. Load `@codemonster-ru/ui-tokens/tokens.css` before it; the token package
is installed as a dependency. The `.cm-control` primitive provides shared control geometry, sizes,
and visual interaction states without owning component semantics. `.cm-surface` and its visual
modifiers provide shared borders and elevation without owning component layout.

Button styles are included in `styles.css` and are also available through the explicit
`@codemonster-ru/ui-css/button.css` entry.

## Documentation

See [CSS-only consumption](../../docs/css/getting-started.md) for import order, themes, primitives,
copied assets, and SSR/Razor delivery.
See the separate [utility CSS guide](../../docs/css/utilities.md) for optional generated helpers.
See the [Table and DataTable guide](../../docs/components/data-tables.md) for responsive table
frames, states, sorting, selection, and pagination styles.
See the [layout primitives guide](../../docs/components/layout-primitives.md) for responsive
Container, Stack, Inline, Section, and Grid composition.

## License

[MIT](./LICENSE)
