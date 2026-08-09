# VueForge Icons

![npm version](https://img.shields.io/npm/v/@codemonster-ru/vueforge-icons)
![npm downloads](https://img.shields.io/npm/dm/@codemonster-ru/vueforge-icons)
![publish](https://img.shields.io/github/actions/workflow/status/codemonster-ru/vueforge/release-from-tag.yml?label=publish)
![license](https://img.shields.io/npm/l/@codemonster-ru/vueforge-icons)

A lightweight Vue 3 icon library with a unified API for the VueForge ecosystem.

Current release: `@codemonster-ru/vueforge-icons@3.2.0`.

## Requirements

- Node.js 18 or newer for consumer tooling and SSR.
- Vue `^3.5.0`.

## Install

```bash
npm install vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
pnpm add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

```bash
yarn add vue@^3.5.0 @codemonster-ru/vueforge-icons
```

## Quick start

```vue
<script setup lang="ts">
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
</script>

<template>
  <VueIconify :icon="icons.check" aria-hidden="true" />
  <VueIconify :icon="icons.check" variant="solid" aria-hidden="true" />
  <VueIconify :icon="icons.house" family="duotone" variant="solid" secondary-color="#94a3b8" aria-hidden="true" />
</template>
```

All system icons support `solid`, `regular`, `light`, and `thin`. `regular` remains the default, so
existing uses keep the VueForge outline rendering. The seven brand marks support only `solid` and
select it by default. Supported variants are listed per icon in `iconCatalog`; the variant names and
their TypeScript union are exported as `iconVariants` and `IconVariant`. The available families and
their union are exported as `iconFamilies` and `IconFamily`.

### Component API

| Prop               | Type                 | Default                                        | Purpose                                       |
| ------------------ | -------------------- | ---------------------------------------------- | --------------------------------------------- |
| `icon`             | `IconName \| string` | `moon`                                         | Catalog name in camelCase or kebab-case.      |
| `family`           | `IconFamily`         | `classic`                                      | Selects `classic` or `duotone`.               |
| `variant`          | `IconVariant`        | `regular` for system icons, `solid` for brands | Selects the supported visual weight.          |
| `secondaryColor`   | `string`             | `--vf-icon-secondary-color` or `currentColor`  | Sets the Duotone secondary color.             |
| `secondaryOpacity` | `number \| string`   | `--vf-icon-secondary-opacity` or `0.4`         | Sets the Duotone secondary opacity.           |
| `size`             | `number \| string`   | VueForge medium icon size token                | Sets SVG width and height.                    |
| `spin`             | `boolean`            | `false`                                        | Enables the reduced-motion-aware animation.   |
| `inset`            | `number`             | `0`                                            | Applies an optical inset inside the icon box. |

Unknown icon names fall back to `moon`. Passing a variant that the selected icon does not support
throws an explicit runtime error. Native SVG attributes such as `aria-label`, `aria-hidden`,
`role`, and `data-*` are forwarded to the rendered SVG.

The root entry exports `VueIconify`, icon names, catalog metadata, and related TypeScript types.
Browser ESM imports automatically load the small component stylesheet. The explicit CSS entry is:

```ts
import '@codemonster-ru/vueforge-icons/style.css';
```

Node ESM and CommonJS conditions are DOM-free and deliberately do not inject CSS. Import
`style.css` from the client stylesheet or browser entry of an SSR application. The CommonJS API
is available through `require('@codemonster-ru/vueforge-icons')`.

The package also retains `dist/index.ts.umd.js` for direct CDN consumers that provide the global
`Vue` runtime. It is a standalone distribution artifact, not a package `exports` subpath.

`VueIconify` accepts icon names dynamically, so the generic renderer includes the complete runtime
catalog. Metadata-only named imports remain tree-shakeable and are protected by an automated bundle
budget. Individual icon entry points are not currently exposed.

## Visual styles

System icons are available in the `classic` and `duotone` families. `classic` is the default and
preserves the canonical geometry. `duotone` uses authored secondary masses or semantic subparts with
primary contours and details; it never derives the second tone by fading an arbitrary part of a
Classic stroke. Regular, Light, and Thin select the primary contour/detail weight while the
secondary anatomy remains visually stable. Indivisible Solid marks remain primary-only instead of being faded
wholesale; multipart Solid icons divide their existing anatomy between primary and secondary paint.
Set the secondary region per icon with `secondaryColor` and `secondaryOpacity`, or theme it globally
with `--vf-icon-secondary-color` and `--vf-icon-secondary-opacity`.

The catalog contains 109 VueForge system icons. Their three outline weights share the approved
24-unit geometry and use stroke widths of 2, 1.5, and 1. Every system icon also contains newly
authored solid geometry on the same 24-unit keyline system. Solid availability is explicitly
represented in each catalog entry.

Solid artwork uses filled silhouettes and transparent detail cutouts. It is authored independently
from the outline paths, and preserved pre-outline migration snapshots are not used as production
geometry.

The solid geometry uses sharp corners for directional and command symbols, a 1.25-unit radius for
tiles, and 2–3-unit radii for containers. Thin structural separators are approximately 0.8 units;
primary negative details use 1.5–2 units. The solid audit also rejects artwork that touches the
canvas edge or falls outside the expected optical-mass range.

The seven brand marks support only `solid`, retain their official geometry, and remain subject to
their owners' trademark guidance. Omitting `variant` selects `solid` for a brand mark. Passing an
unsupported outline variant to a brand mark raises an explicit runtime error.

`IconCatalogEntry.variants` is the authoritative variant contract. The previous `style` field is
retained as deprecated compatibility metadata for the 3.x line: it reports the canonical source
family (`outline` for system icons and `solid` for brand marks), but does not select a runtime
variant.

## Maintainer checks

```bash
npm run validate-icons
npm run snapshot:variants:check
npm run audit:bundle
npm run check
```

Intentional geometry changes require `npm run snapshot:variants:update`. The committed reference
sheets cover every system icon in both families and all four variants at 16, 20, 24, and 32 px.
Bundle auditing separately protects metadata-only tree-shaking and the full `VueIconify` runtime
budget.

## More documentation

For full documentation, visit [docs.codemonster.net/vueforge/icons](https://docs.codemonster.net/vueforge/icons/).
See
[src/lib/index.ts](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/src/lib/index.ts)
and [CHANGELOG.md](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/CHANGELOG.md)
for the package-local public contract and release history.

## License

[MIT](https://github.com/codemonster-ru/vueforge/blob/main/packages/icons/LICENSE)
