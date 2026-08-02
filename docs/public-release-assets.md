# VueForge Icons 3.0.0 and Core 2.3.0 public release assets

These copy-ready assets describe the coordinated Icons, Core, and CodeBlock release. Publish them
only after all three workflows and registry-only consumer smoke tests have passed.

## Short project description

VueForge is a Vue 3 ecosystem for accessible design-system foundations, theming, components,
layouts, icons, highlighted code, and secure interactive playgrounds.

## Key release features

- A complete 109-icon VueForge outline system with seven preserved solid brand marks.
- A new accessible Date Picker with day, month, year, time, multiple, and range selection.
- Data Table sorting, visibility, reordering, resizing, pinning, expansion, localization, errors,
  selection constraints, and responsive pagination.
- Coordinated Icons 3 compatibility in Core and CodeBlock.

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
| Icons                  | `3.0.0` |            Yes            |
| Core                   | `2.3.0` |            Yes            |
| Layouts                | `2.1.1` |            No             |
| CodeBlock              | `4.0.1` |            Yes            |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## GitHub Release introductions

Package-specific changelog sections remain the source of truth for the generated GitHub Releases.

### VueForge Icons 3.0.0

VueForge Icons 3.0 completes the migration of 109 product icons to a consistent 24-unit outline
language. Seven official brand marks retain their independent solid geometry. Public icon names are
unchanged.

### VueForge Core 2.3.0

VueForge Core 2.3 adds `VfDatePicker` and completes the current Data Table interaction set. Date
Picker supports localized day, month, year, time, multiple, and range workflows. Data Table gains
sorting, column visibility, reordering, resizing, pinning, expansion, localization, error handling,
selection constraints, and responsive pagination.

### VueForge CodeBlock 4.0.1

VueForge CodeBlock 4.0.1 adds package-level compatibility with Icons 3 and refreshes its declaration
build for the current Vue toolchain.

## Upgrade

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-icons@^3.0.0 \
  @codemonster-ru/vueforge-core@^2.3.0 \
  @codemonster-ru/vueforge-codeblock@^4.0.1
```

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> VueForge Icons 3.0 and Core 2.3 are available for Vue 3.5 applications. The release completes the
> 109-icon product outline system, adds the new Date Picker, and expands Data Table with sorting,
> visibility, reordering, resizing, pinning, expansion, localization, and responsive pagination.
> See
> [the release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
> for package versions and migration details.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
