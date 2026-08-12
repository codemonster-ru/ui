# CodeMonster UI CSS

Framework-independent foundation and component styles for CodeMonster UI.

Current release: `@codemonster-ru/ui-css@0.1.0`.

## Requirements

- A browser supported by the CodeMonster UI browser policy.
- No JavaScript or UI framework runtime.

## Installation

```bash
npm install @codemonster-ru/ui-css
```

## Quick start

```css
@import '@codemonster-ru/ui-css/styles.css';
```

The stylesheet includes a predictable document reset, token-backed document colors and typography,
keyboard-visible focus rings for native controls and `.cm-focus-ring`, and reduced-motion and
forced-colors foundations. Load `@codemonster-ru/ui-tokens/tokens.css` before it; the token package
is installed as a dependency. The `.cm-control` primitive provides shared control geometry, sizes,
and visual interaction states without owning component semantics.

## Documentation

CSS-only consumption documentation is added when the initial public entries are complete.

## License

[MIT](./LICENSE)
