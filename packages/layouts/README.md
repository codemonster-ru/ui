# CodeMonster UI Layouts

Page layouts for CodeMonster UI, rendered by the Vue adapter.

This guide covers version `2.0.1`. See the [2.0 release notes](../../docs/codemonster-ui-2.0-release-notes.md)
for release status and matching package versions.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and SSR.
- Vue `^3.5.0`.

## Installation

Install the Layouts package in your Vue 3.5 app.

```bash
npm install @codemonster-ru/ui-layouts@2.0.1 @codemonster-ru/ui-vue@2.0.0 @codemonster-ru/ui-tokens@2.0.0 @codemonster-ru/ui-css@2.0.0
```

## Quick start

The package exports application shells, authentication and error pages, and semantic page regions.
Node `require()` on the supported Node versions loads the same layout module as ESM imports.
Deep imports such as `@codemonster-ru/ui-layouts/historical/container` offer default and named
exports with automatic CSS in browser bundlers. Node uses CSS-free entries.
See the [layout guide](../../docs/components/layouts.md) for Vue examples and canonical HTML.

## What belongs here

A layout composes components into a page shell: its regions, their geometry, and the state deciding
whether a region is shown. Components live in [`ui-vue`](../vue/README.md); the two are separate
packages so that the two things can be named apart.

Layouts render the same canonical DOM as Vanilla templates and publish their state in
`data-cm-*` attributes. Vue consumers can also compose their controls through native scoped slots
and component ref methods.

## Documentation

See [layout line ownership](../../docs/architecture/layout-line-ownership.md) for what this package
carries and where the historical compatibility boundaries are.

Use direct layout imports, configure theme preferences with the Vue theme provider, and use shared CSS
tokens for preset overrides. Load `ui-tokens` and `ui-css` in the app entry when using aggregate
imports. See the [migration guide](../../docs/migrate-from-vueforge.md#theme-presets-and-preference).

## License

[MIT](./LICENSE)
