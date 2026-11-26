# CodeMonster UI Icons

Framework-independent icon geometry for CodeMonster UI.

This guide covers version `2.0.1`. See the [2.0 release notes](../../docs/codemonster-ui-2.0-release-notes.md)
for release status and matching package versions.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and programmatic ESM use.
- No UI framework runtime.

## Status

This package owns the rendered geometry of 119 icons across two families and four variants, as data
rather than as a rendering engine. Vue consumes the stored geometry directly. Vanilla templates can embed the corresponding SVG.

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

Install the Icons package from npm.

```bash
npm install @codemonster-ru/ui-icons@2.0.1
```

The Vue adapter takes the geometry as a prop, so install this alongside `@codemonster-ru/ui-vue`.

## Generating from source

Run this command from a [CodeMonster UI checkout](https://github.com/codemonster-ru/ui) after installing
the workspace dependencies.

```bash
npm run generate -w @codemonster-ru/ui-icons
```

The generator reads the SVG bodies and viewBoxes in [`data/geometry.json`](./data/geometry.json).
Edit that file to update the generated geometry, then regenerate `src/generated/`. The source file
and `src/generated/provenance.json` record where the original geometry came from. The CodeMonster
sorting icons are authored in `src/sort-icons.ts`.

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
