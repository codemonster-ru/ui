# CodeMonster UI Icons

Framework-independent icon geometry for CodeMonster UI.

Current version: `@codemonster-ru/ui-icons@2.0.0-dev.0` — in development, not published.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and programmatic ESM use.
- No UI framework runtime.

## Status

This package owns the rendered geometry of 116 icons across two families and four variants, as data
rather than as a rendering engine. The Vue and Annabel Razor adapters read the same geometry and
emit it; neither draws anything.

That is the point. The VueForge renderer is 2,135 lines carrying per-icon masks, duotone exceptions,
solid-body overrides and optical offsets. Reimplementing it in PHP would have meant two engines
obliged to agree on 879 outputs, and an icon that renders slightly differently still renders — the
drift would not announce itself. Precomputing removes the second engine instead of testing it. See
[the decision](../../docs/architecture/icon-line-ownership.md).

The package does not depend on Vue or another UI framework.

## Quick start

```ts
import { CmIcon } from '@codemonster-ru/ui-vue';
import { arrowLeft } from '@codemonster-ru/ui-icons';
```

```vue
<CmIcon :icon="arrowLeft" variant="solid" label="Back" />
```

Without a `label` the icon is `aria-hidden`, which is right for decoration sitting beside text that
already names the action.

On the Annabel Razor side the name is enough, because the adapter reads the same geometry from disk:

```php
<cm-icon icon="arrowLeft" variant="solid" label="Back" />
```

## Installation

```bash
npm install @codemonster-ru/ui-icons@^2.0.0-dev.0
```

The Vue adapter takes the geometry as a prop, so install this alongside `@codemonster-ru/ui-vue`.

## Generating

```bash
npm run generate -w @codemonster-ru/ui-icons
```

The generator renders every combination from `@codemonster-ru/vueforge-icons` headlessly — no
browser, no bundler — and writes one module per icon, plus one JSON file per icon for the Razor
adapter. `src/generated/provenance.json` records the source version and the commit it was read at.

Both outputs are committed, because the Razor adapter reads its copy without running Node.

## Shape

One module per icon, so a consumer using five icons ships roughly 3 KB gzipped rather than the 26 KB
the whole set weighs.

Not every icon has every form. A brand mark has one canonical rendering, so there is no thin-stroke
GitHub logo to record, and `resolveCmIcon` falls back to the form that exists rather than failing.

## Documentation

See [icon line ownership](../../docs/architecture/icon-line-ownership.md) for why the geometry is
precomputed rather than rendered twice, and what was measured before deciding it.

## License

[MIT](./LICENSE)
