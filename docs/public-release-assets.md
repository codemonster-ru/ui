# VueForge public release assets

These copy-ready assets describe the coordinated VueForge release train. Publish them only after
all eight package workflows and the final registry-only consumer smoke test have passed.

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

## GitHub Release description

The release workflow creates one GitHub Release for each scoped package tag and takes its package
changes from the matching `CHANGELOG.md` section. Use the following text as the coordinated
project-level description or introduction; package-specific changelogs remain the source of truth.

### VueForge coordinated public release

VueForge's coordinated release train is ready for public Vue 3 applications. It brings the theme
contract, semantic token architecture, accessible OKLCH defaults, hardened component behavior, and
verified npm distribution together in compatible package versions.

This release includes:

- consistent runtime, static, full, and component-entry theme contracts;
- accessible light and dark defaults without public token removal;
- deterministic SSR and hydration behavior;
- coordinated overlays, keyboard interactions, focus management, RTL, reduced motion, and forced
  colors;
- corrected ESM, CommonJS, TypeScript, CSS, and browser/Node package conditions;
- secure, deferred CodeBlock and Playground runtimes;
- clean npm, pnpm, and Yarn tarball-consumer validation.

Install only the packages used by an application. Core starts at
`@codemonster-ru/vueforge-core@1.36.0` and requires Vue `^3.5.0`. CodeBlock and Playground require
Node.js 20 or newer; other consumer packages require Node.js 18 or newer.

Read the
[migration guide](https://github.com/codemonster-ru/vueforge/blob/main/docs/migration-guide.md)
before upgrading and the
[coordinated release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
for package versions, behavior corrections, and bundle notes.

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> VueForge's coordinated public release is now available for Vue 3.5 applications. The release
> includes accessible components and layouts, light/dark runtime theming, icons, CodeBlock, and a
> secure interactive Playground, backed by verified TypeScript, SSR, CSS, tree-shaking, and clean
> npm/pnpm/Yarn consumer paths. Start with
> [the documentation](https://docs.codemonster.net/vueforge/) and review the
> [migration guide](https://github.com/codemonster-ru/vueforge/blob/main/docs/migration-guide.md)
> when upgrading.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
