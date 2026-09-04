# CodeMonster UI

CodeMonster UI is a cross-platform design system with shared tokens, CSS, browser behavior, and
supported adapters for Vue 3 and Annabel Razor.

## CodeMonster UI 1.1

Install the stable Vue packages:

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-vue@^1.1.0 @codemonster-ru/ui-css@^1.1.0
```

Install the stable Annabel Razor package:

```bash
composer require codemonster-ru/ui-razor:^1.1.0
```

See the [CodeMonster UI 1.1 release notes](./docs/codemonster-ui-1.1-release-notes.md),
[component documentation](./docs/components/button.md), and
[CSS-only guide](./docs/css/getting-started.md).

Local runnable examples are available in [`examples/ui-showcase`](./examples/ui-showcase) for Vue
and [`examples/razor`](./examples/razor) for Annabel Razor/PHP.

## VueForge

CodeMonster UI succeeds VueForge, the Vue-only design system this project migrated from. VueForge
is sunset: no new components, no new fixes. Its packages and documentation now live in
[`codemonster-ru/vueforge`](https://github.com/codemonster-ru/vueforge), where existing consumers
can continue to install them; nothing in this repository builds or publishes them anymore.

### Requirements

- Node.js `>=24.15.0` for the repository workspace and development scripts. The required version is
  pinned by [`.nvmrc`](./.nvmrc) and enforced by the root `package.json`.
- Vue `^3.5.0` for the Vue packages.
- Published packages may declare narrower runtime requirements in their own manifests; consult the
  package documentation when consuming them outside this repository.

### Documentation

Start at [the documentation index](./docs/index.md) and see the
[release notes](./docs/release-notes.md) for coordinated package changes.

## License

CodeMonster UI packages are available under the [MIT License](./LICENSE).
