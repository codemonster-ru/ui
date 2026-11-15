# CodeMonster UI Layouts

Page layouts for CodeMonster UI, rendered by the Vue adapter.

Current version: `@codemonster-ru/ui-layouts@2.0.0-dev.0` — in development, not published.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and SSR.
- Vue `^3.5.0`.

## Installation

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-layouts@^2.0.0-dev.0 @codemonster-ru/ui-vue@^2.0.0-dev.0 @codemonster-ru/ui-css@^2.0.0-dev.0
```

## Quick start

The package exports application shells, authentication and error pages, and semantic page regions.
Node `require()` on the supported Node versions loads the same layout module as ESM imports.
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

Projects using `app.use(VueForgeLayouts)`, the VueForge layout preset API, or the old
component subpaths can keep those contracts by pinning the archived VueForge packages:

```bash
npm install --save-exact vue@3.5.45 @codemonster-ru/vueforge-core@2.4.0 @codemonster-ru/vueforge-layouts@2.1.2 @codemonster-ru/vueforge-icons@3.2.0 @codemonster-ru/vueforge-theme@2.0.1
```

Continue importing `@codemonster-ru/vueforge-core/styles.css` and
`@codemonster-ru/vueforge-layouts/styles.css` in that application. The historical plugin and style
imports use VueForge tokens. The CodeMonster component adapter uses `@codemonster-ru/ui-tokens`
and `@codemonster-ru/ui-css`. See [compatibility verification](../../docs/verification/historical-vue-ecosystem.md).

## License

[MIT](./LICENSE)
