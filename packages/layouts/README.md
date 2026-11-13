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

The package exports `CmAdminLayout`, `CmAdminShell`, `CmAppShell`, `CmDocumentLayout`, and
`CmSetupLayout`. See the [layout guide](../../docs/components/layouts.md) for Vue examples and
canonical HTML.

## What belongs here

A layout composes components into a page shell: its regions, their geometry, and the state deciding
whether a region is shown. Components live in [`ui-vue`](../vue/README.md); the two are separate
packages so that the two things can be named apart.

Layouts render the same canonical DOM as Vanilla templates, and their state is expressed as
`data-cm-*` attributes rather than framework-specific slot scopes, so both adapters can carry it.

## Documentation

See [layout line ownership](../../docs/architecture/layout-line-ownership.md) for what this package
carries, what was dropped, and what remains deferred.

## License

[MIT](./LICENSE)
