# CodeMonster UI

CodeMonster UI is a cross-platform design system with shared tokens, CSS, browser behavior, and
two integration modes: Vue 3 and Vanilla HTML + CSS + JavaScript.

## CodeMonster UI 1.1

Install the stable Vue packages:

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-vue@^1.1.0 @codemonster-ru/ui-css@^1.1.0
```

See the [CodeMonster UI 1.1 release notes](./docs/codemonster-ui-1.1-release-notes.md),
[component documentation](./docs/components/button.md), and
[CSS-only guide](./docs/css/getting-started.md).

## Preview locally

Run `npm ci` from the repository root once. Run `npm run preview` to build and open the Vue
showcase, or `npm run preview:vanilla` to build and open the full Vanilla HTML showcase. Both
commands are available under the root `package.json` in the VS Code NPM Scripts panel.

Use `npm run dev` for the Vue showcase with hot reload. See the
[Vanilla guide](./docs/vanilla.md) for the static assets and template integration.

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
