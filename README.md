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

The Vue and Vanilla showcases are development tools for trying components, states, and layouts.
Both open on the **Visual matrix** for reviewing variants by category.

Run `npm ci` from the repository root once. Use the following root commands in the terminal or
under the root `package.json` in VS Code's NPM Scripts panel.

| Task | Vue showcase | Vanilla showcase |
| --- | --- | --- |
| Develop with browser updates | `npm run dev` · [5177](http://127.0.0.1:5177) | `npm run dev:vanilla` · [5178](http://127.0.0.1:5178) |
| Build the local showcase | `npm run build:showcase` | `npm run build:vanilla` |
| Open the existing build | `npm run preview` · [4173](http://127.0.0.1:4173) | `npm run preview:vanilla` · [4174](http://127.0.0.1:4174) |

The NPM Scripts panel also lists `dev`, `build`, and `preview` under `examples/ui-showcase/package.json`
for Vue and `examples/vanilla/package.json` for Vanilla.

Run the build before the first preview and whenever you want to refresh the previewed artifact.
`npm run build` builds the seven npm packages. Use `npm test` for package and UI contract tests,
`npm run check` for documentation and package checks, and `npm run verify` for release checks.
After the first package build, use `-w` to focus a command on one workspace, for example
`npm test -w @codemonster-ru/ui-vue`.
The [showcase README](./examples/ui-showcase/README.md) explains which files to edit and serve;
the [Vanilla guide](./docs/vanilla.md) covers static assets and template integration.

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
