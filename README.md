# CodeMonster UI

[![CI status on main](https://github.com/codemonster-ru/ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/codemonster-ru/ui/actions/workflows/ci.yml)

CodeMonster UI is a design system for teams building forms, navigation, and application layouts
with Vue 3 or server-rendered HTML. Both integrations share design tokens, styles, semantic
markup, and interaction rules. Vanilla pages can use CSS on its own and load the browser
controllers when they need interactive behavior.

[Get started](#get-started) · [Documentation](./docs/index.md) · [Packages](#packages)

## Get started

Install CodeMonster UI 2 from npm. See the [installation guide](./docs/getting-started.md#install-from-npm)
for supported Node.js versions and package combinations.

### Vue 3

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-tokens@^2.0.0 \
  @codemonster-ru/ui-css@^2.0.0 @codemonster-ru/ui-icons@^2.0.0 @codemonster-ru/ui-vue@^2.0.0
```

Follow the [Vue quick start](./docs/getting-started.md#vue-quick-start) for styles and a first component.

### Vanilla HTML

```bash
npm install @codemonster-ru/ui-tokens@^2.0.0 @codemonster-ru/ui-css@^2.0.0
```

Add `@codemonster-ru/ui-runtime@^2.0.0` for interactive controllers. The
[Vanilla guide](./docs/vanilla.md#quick-start) shows markup and stylesheet imports.

## Preview locally

![Vue Core showcase showing the theme switch and typography examples](./docs/assets/reference-showcase.png)

The Vue and Vanilla showcases open on **Core** for interactive component examples. **Layouts** has
resizable application previews, layout primitives, and regions. **Colors** shows the palette,
themes, and contrast. **Icons** is a searchable catalog.

From the repository root, run `npm ci` with the Node.js version in [`.nvmrc`](./.nvmrc).

| Task | Vue showcase | Vanilla showcase |
| --- | --- | --- |
| Develop with browser updates | `npm run dev` · [5177](http://127.0.0.1:5177) | `npm run dev:vanilla` · [5178](http://127.0.0.1:5178) |
| Build the local showcase | `npm run build:showcase` | `npm run build:vanilla` |
| Open the existing build | `npm run preview` · [4173](http://127.0.0.1:4173) | `npm run preview:vanilla` · [4174](http://127.0.0.1:4174) |

Build once before previewing an adapter. The [showcase guide](./examples/ui-showcase/README.md)
describes component routes, layout examples and static hosting.

## Packages

| Package | npm (`latest`) | Use |
| --- | --- | --- |
| [`@codemonster-ru/ui-tokens`](./packages/tokens/README.md) | [![npm version for UI Tokens](https://img.shields.io/npm/v/@codemonster-ru/ui-tokens/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-tokens) | Themes, design tokens, and breakpoints |
| [`@codemonster-ru/ui-css`](./packages/css/README.md) | [![npm version for UI CSS](https://img.shields.io/npm/v/@codemonster-ru/ui-css/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-css) | Shared styles, fonts, and component CSS |
| [`@codemonster-ru/ui-runtime`](./packages/runtime/README.md) | [![npm version for UI Runtime](https://img.shields.io/npm/v/@codemonster-ru/ui-runtime/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-runtime) | Vanilla controllers and shared behavior |
| [`@codemonster-ru/ui-icons`](./packages/icons/README.md) | [![npm version for UI Icons](https://img.shields.io/npm/v/@codemonster-ru/ui-icons/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-icons) | Framework-independent icon geometry |
| [`@codemonster-ru/ui-vue`](./packages/vue/README.md) | [![npm version for UI Vue](https://img.shields.io/npm/v/@codemonster-ru/ui-vue/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-vue) | Vue components |
| [`@codemonster-ru/ui-layouts`](./packages/layouts/README.md) | [![npm version for UI Layouts](https://img.shields.io/npm/v/@codemonster-ru/ui-layouts/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-layouts) | Vue page layouts, shells, and regions |
| [`@codemonster-ru/ui-utilities`](./packages/utilities/README.md) | [![npm version for UI Utilities](https://img.shields.io/npm/v/@codemonster-ru/ui-utilities/latest)](https://www.npmjs.com/package/@codemonster-ru/ui-utilities) | Optional design-token-based utility CSS |

## Documentation and architecture

- [Documentation index](./docs/index.md) and [component reference](./docs/components/index.md).
- [Vanilla integration](./docs/vanilla.md) and [server rendering and hydration](./docs/integration.md#server-rendering-and-hydration).
- [Architecture](./ARCHITECTURE.md) and [component contracts](./contracts/README.md).
- [VueForge migration](./docs/migrate-from-vueforge.md) from the
  [VueForge repository](https://github.com/codemonster-ru/vueforge).

## Development checks

Run `npm run check` for documentation and package checks, and `npm test` for package and UI
contract tests. The [contribution guide](./CONTRIBUTING.md) explains how to choose focused
checks and include browser evidence. Use the [release checklist](./docs/release-checklist.md)
for release verification.

## Support and contributing

Use [GitHub Issues](https://github.com/codemonster-ru/ui/issues) for usage questions and
reproducible bugs. Follow the [contribution guide](./CONTRIBUTING.md) for changes or the
[security policy](./SECURITY.md) to report a vulnerability privately.

Part of [CodeMonster](https://github.com/codemonster-ru). Licensed under the [MIT License](./LICENSE).
