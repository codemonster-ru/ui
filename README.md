# CodeMonster UI

CodeMonster UI is a cross-platform design system with shared tokens, CSS, browser behavior, and
two integration modes: Vue 3 and Vanilla HTML + CSS + JavaScript.

## CodeMonster UI 1.1

Install the stable Vue packages:

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-vue@^1.1.0 @codemonster-ru/ui-css@^1.1.0
```

See the [CodeMonster UI 1.1 release notes](./docs/codemonster-ui-1.1-release-notes.md),
[2.0 checkout quick starts](./docs/getting-started.md), and
[Vue and Vanilla component reference](./docs/components/index.md).

## Preview locally

Run `npm ci` from the repository root once. Run `npm run preview` to build and open the Vue
showcase, or `npm run preview:vanilla` to build and open the full Vanilla HTML showcase. Both
commands are available under the root `package.json` in the VS Code NPM Scripts panel.

Use `npm run dev` for the Vue showcase with hot reload. See the
[Vanilla guide](./docs/vanilla.md) for the static assets and template integration.

## Development checks

Run the smallest check that covers the change. For a Vue component, run its source test directly:

```sh
npm exec -w @codemonster-ru/ui-vue -- vitest run src/components/button/CmButton.test.ts
```

Use `npm test -w @codemonster-ru/ui-runtime` for a standalone package test. Check dependent
packages when behavior or an export changes. For a broader change, use
`npm run check -- "$(git rev-parse origin/main)"` to test the changed workspaces and their published
dependants. `npm run check` checks the full graph. Shared contracts, configuration and lockfile
changes select the full graph automatically.

CI runs on pull requests and pushes to `main`, with a short Chromium smoke for applicable changes.
The tag workflow runs package and strict browser verification before publishing. See the
[release checklist](./docs/release-checklist.md) for release commands and manual checks.

## VueForge

CodeMonster UI succeeds VueForge, the Vue-only design system this project migrated from. VueForge
is sunset: no new components, no new fixes. Its packages and documentation now live in
[`codemonster-ru/vueforge`](https://github.com/codemonster-ru/vueforge), where existing consumers
can continue to install them; nothing in this repository builds or publishes them anymore.

See the [VueForge migration guide](./docs/migrate-from-vueforge.md) for current package entries,
shared styles, and standalone Vanilla integration.

### Requirements

- Node.js `>=24.15.0` for the repository workspace and development scripts. The required version is
  pinned by [`.nvmrc`](./.nvmrc) and enforced by the root `package.json`.
- Vue `^3.5.0` for the Vue packages.
- Published packages may declare narrower runtime requirements in their own manifests; consult the
  package documentation when consuming them outside this repository.

### Documentation

The [documentation index](./docs/index.md) links to integration guides, design tokens,
application recipes, and [release notes](./docs/release-notes.md).

## License

CodeMonster UI packages are available under the [MIT License](./LICENSE).
