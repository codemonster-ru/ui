# CodeMonster UI showcase

A live demonstration of components and layouts that have no VueForge ancestor.

The VueForge playground in [`examples/vue`](../vue) is pinned to commit `fd793696` and compared
against it pixel for pixel, which is what proves the migration did not change how anything looks.
Its shell renders a section navigation on every route, so adding a demo there shifts page height and
reports changed frames across the whole gate — even when nothing has regressed.

Components without a predecessor cannot be shown in a comparison against a commit that predates
them, so they live here instead. That keeps the frozen example doing its real job: catching visual
drift in the components that were migrated.

```sh
npm run dev -w @codemonster-ru/ui-showcase-example
```

Anchors in `src/App.vue` are referenced by `demoHref` in the migration catalog, and the coverage
check fails if one goes missing.
