# VueForge 2 public release assets

These copy-ready assets describe the coordinated VueForge 2 release. Publish them only after all
eight package workflows and the registry-only consumer smoke tests have passed.

## Short project description

VueForge is a Vue 3 ecosystem for accessible design-system foundations, theming, components,
layouts, icons, highlighted code, and secure interactive playgrounds.

## Key features

- Vue 3.5 components, composables, responsive layouts, and application shells.
- Primitive and semantic theme tokens with light, dark, runtime, and scoped-theme support.
- Keyboard, focus, ARIA, RTL, reduced-motion, forced-colors, SSR, and hydration support.
- Standalone icons and syntax-highlighted CodeBlock packages.
- Vue Playground UI, a framework-agnostic runtime, and optional Vite virtual modules.
- ESM, CommonJS where supported, TypeScript declarations, explicit CSS entries, and tree-shakeable
  component subpaths.

## npm package descriptions

These descriptions match the publication manifests:

| Package                                           | npm description                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@codemonster-ru/vueforge-theme`                  | Shared theme engine, tokens, and preset runtime for the VueForge ecosystem.                                       |
| `@codemonster-ru/vueforge-icons`                  | Open-source Vue 3 icon library for the VueForge ecosystem.                                                        |
| `@codemonster-ru/vueforge-core`                   | Foundation layer for the VueForge design system.                                                                  |
| `@codemonster-ru/vueforge-layouts`                | Layout primitives, shell components, and responsive composables for Vue 3 applications.                           |
| `@codemonster-ru/vueforge-codeblock`              | Standalone Vue 3 code block component for the VueForge ecosystem with syntax highlighting and light/dark theming. |
| `@codemonster-ru/vueforge-playground-core`        | Framework-agnostic playground core runtime                                                                        |
| `@codemonster-ru/vueforge-playground-vite-plugin` | Vite plugin for VueForge playground virtual modules                                                               |
| `@codemonster-ru/vueforge-playground`             | Vue 3 playground UI adapter for the VueForge playground core runtime.                                             |

## Coordinated versions

| Package                | Version |
| ---------------------- | ------: |
| Theme                  | `2.0.0` |
| Icons                  | `2.0.0` |
| Core                   | `2.0.0` |
| Layouts                | `2.0.0` |
| CodeBlock              | `4.0.0` |
| Playground Core        | `2.0.0` |
| Playground Vite Plugin | `1.0.0` |
| Playground             | `3.0.0` |

## GitHub Release description

The release workflow creates one GitHub Release for each scoped package tag and takes its package
changes from the matching `CHANGELOG.md` section. Use the following text as the coordinated
project-level introduction; package-specific changelogs remain the source of truth.

### VueForge 2

VueForge 2 completes the transition to one primitive and semantic token architecture. It removes
legacy token aliases, deprecated TypeScript spellings, compatibility resolver metadata, implicit
`data-theme` handling, dead runtime paths, and unused styling hooks.

The release introduces the accessible OKLCH palette and consistent interaction-state treatment while
preserving the component set, custom theme prefixes and attributes, and advertised CommonJS support.
Package `exports` now defines every supported JavaScript, declaration, Node, browser, and CSS entry.

Upgrade interdependent packages together. Core starts at
`@codemonster-ru/vueforge-core@2.0.0` and requires Vue `^3.5.0`. CodeBlock 4 and Playground 3
require Node.js 20 or newer; other consumer packages require Node.js 18 or newer.

Read
[Migrating to VueForge 2](https://github.com/codemonster-ru/vueforge/blob/main/docs/migration-to-v2.md)
before upgrading and the
[coordinated release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
for package versions and release details.

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> VueForge 2 is available for Vue 3.5 applications. This breaking release removes the completed
> 1.x compatibility layer and leaves one canonical token, theme, runtime, and package-entry
> architecture. It also delivers the new accessible OKLCH palette and hardened interaction states,
> while scoped theming, CommonJS support, and explicit CSS entries remain intact. Start with
> [the documentation](https://docs.codemonster.net/vueforge/) and review
> [Migrating to VueForge 2](https://github.com/codemonster-ru/vueforge/blob/main/docs/migration-to-v2.md)
> before upgrading.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
