# CodeMonster UI Icons

Framework-independent icon geometry for CodeMonster UI.

Current version: `@codemonster-ru/ui-icons@2.0.0-dev.0` — in development, not published.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and programmatic ESM use.
- No UI framework runtime.

## Status

This package owns the rendered geometry of 116 icons across two families and four variants, as data
rather than as a rendering engine. Vue consumes the stored geometry directly. Vanilla templates can embed the corresponding SVG.

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

Vanilla templates can use the [canonical SVG markup](../../contracts/icon/cases/default.html).

## Catalogue metadata

Use `@codemonster-ru/ui-icons/catalog` for the historical icon order, categories, titles,
keywords, available weights, and brand attribution. It has no dependency on generated geometry.

```ts
import { iconCatalog, icons } from '@codemonster-ru/ui-icons/catalog';

const backLabel = iconCatalog.arrowLeft.title;
const backName = icons.arrowLeft;
```

## Installation

```bash
npm install @codemonster-ru/ui-icons@^2.0.0-dev.0
```

The Vue adapter takes the geometry as a prop, so install this alongside `@codemonster-ru/ui-vue`.

## Generating

```bash
npm run generate -w @codemonster-ru/ui-icons -- /path/to/built/vueforge-icons <source-commit>
```

The generator reads a built `@codemonster-ru/vueforge-icons` package and renders every combination
in Node. Pass the source commit for an unpacked archive. In a source checkout the generator can
read the revision from Git. `src/generated/provenance.json` records the source version and revision.

## Shape

Named imports load only the geometry used by the consumer. The generated modules store repeating
SVG bodies once per icon. The `/controls` entry provides the regular chevrons and external link
marker with the same SVG as their complete forms.

Not every icon has every form. A brand mark has one canonical rendering, so there is no thin-stroke
GitHub logo to record, and `resolveCmIcon` falls back to the form that exists rather than failing.

## Documentation

See [icon line ownership](../../docs/architecture/icon-line-ownership.md) for why the geometry is
precomputed rather than rendered twice, and what was measured before deciding it.

## License

[MIT](./LICENSE)
