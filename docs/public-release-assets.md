# VueForge August 2026 public release assets

These copy-ready assets describe the coordinated Theme, Icons, Core, Layouts, Playground Core, and
Playground release. Publish them only after all six workflows and registry-only consumer smoke tests
have passed.

## Short project description

VueForge is a Vue 3 ecosystem for accessible design-system foundations, theming, components,
layouts, icons, highlighted code, and secure interactive playgrounds.

## Key release features

- Five reusable Core components for admin forms and workflows, plus disabled Dropdown triggers.
- One canonical responsive-query build contract shared by Theme, Core, Layouts, and Playground.
- Classic and Duotone families across all 109 VueForge system icons.
- Lazily downloaded, worker-based TypeScript compilation for browser playgrounds.

## Current ecosystem versions

| Package                | Version | Published in this release |
| ---------------------- | ------: | :-----------------------: |
| Theme                  | `2.0.1` |            Yes            |
| Icons                  | `3.2.0` |            Yes            |
| Core                   | `2.4.0` |            Yes            |
| Layouts                | `2.1.2` |            Yes            |
| CodeBlock              | `4.0.1` |            No             |
| Playground Core        | `2.1.0` |            Yes            |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.1` |            Yes            |

## GitHub Release introductions

Package-specific changelog sections remain the source of truth for generated GitHub Releases.

### VueForge Theme 2.0.1

VueForge Theme 2.0.1 adds the shared build-time breakpoint query registry used across VueForge
packages and centralizes exclusive maximum-width query generation.

### VueForge Icons 3.2.0

VueForge Icons 3.2 adds an authored Duotone family across all 109 system icons and all four runtime
weights. Existing calls keep the unchanged Classic family by default, while new props and exports
provide typed control over family and secondary paint.

### VueForge Core 2.4.0

VueForge Core 2.4 adds Confirm Dialog, Data Table Column Chooser, Form Layout, Group Box, and Page
Header components, a complete disabled Dropdown state, shared responsive-query resolution, and a
Stepper connector fix.

### VueForge Layouts 2.1.2

VueForge Layouts 2.1.2 resolves media and container queries through the shared Theme registry and
adds publish guards against unresolved breakpoint aliases.

### VueForge Playground Core 2.1.0

VueForge Playground Core 2.1 moves TypeScript compilation off the UI thread and downloads the
compiler worker only for TypeScript-bearing sandbox sessions.

### VueForge Playground 3.0.1

VueForge Playground 3.0.1 adopts the worker-based Playground Core runtime and the shared responsive
query contract for tab wrapping.

## Upgrade

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-theme@^2.0.1 \
  @codemonster-ru/vueforge-icons@^3.2.0 \
  @codemonster-ru/vueforge-core@^2.4.0 \
  @codemonster-ru/vueforge-layouts@^2.1.2 \
  @codemonster-ru/vueforge-playground-core@^2.1.0 \
  @codemonster-ru/vueforge-playground@^3.0.1
```

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> The August 2026 VueForge release is available for Vue 3.5 applications. It adds reusable admin
> workflow components, shared responsive-query builds, a complete Duotone icon family, and
> worker-based TypeScript compilation that stays out of JavaScript-only playground sessions. See
> [the release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
> for package versions and upgrade details.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
