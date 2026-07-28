# VueForge Core 2.3.0 public release assets

These copy-ready assets describe the VueForge Core 2.3.0 release. Publish them only after the Core
workflow and registry-only consumer smoke tests have passed.

## Short project description

VueForge is a Vue 3 ecosystem for accessible design-system foundations, theming, components,
layouts, icons, highlighted code, and secure interactive playgrounds.

## Key release features

- Pointer and keyboard resizing between adjacent `VfDataTable` columns.
- Double-click content autosizing with `minWidth` and `maxWidth` constraints.
- Controlled, uncontrolled, and persistable column-width state.
- Per-column `nowrap` and `resizable` controls.
- A public `dataTableColumnResizerColor` theme token.

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

## Current ecosystem versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.0` |            No             |
| Icons                  | `2.0.0` |            No             |
| Core                   | `2.3.0` |            Yes            |
| Layouts                | `2.1.1` |            No             |
| CodeBlock              | `4.0.0` |            No             |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## GitHub Release description

The release workflow creates one GitHub Release for the Core package tag and takes its package
changes from the matching `CHANGELOG.md` section. Use the following text as the project-level
introduction; package-specific changelogs remain the source of truth.

### VueForge Core 2.3.0

VueForge Core 2.3.0 adds constrained and persistable column resizing to `VfDataTable`.

Applications can resize a boundary with a pointer, use Left and Right Arrow from the focused handle,
or double-click to fit rendered content. Adjacent columns compensate each other so the overall table
width and unrelated boundaries remain fixed. Widths support controlled and uncontrolled state,
column constraints, and application-managed persistence.

This is a backward-compatible release. Upgrade Core independently:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.3.0
```

Read the
[coordinated release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
for the complete version matrix and package details.

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> VueForge Core 2.3.0 is available for Vue 3.5 applications. The release adds constrained pointer
> and keyboard column resizing, content autosizing, persistable width state, and resize-boundary
> theming to `VfDataTable`. See
> [the release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
> for the coordinated package versions.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
