# VueForge 2.1.1 public release assets

These copy-ready assets describe the VueForge Core and Layouts 2.1.1 release. Publish them only after
both package workflows and the registry-only consumer smoke tests have passed.

## Short project description

VueForge is a Vue 3 ecosystem for accessible design-system foundations, theming, components,
layouts, icons, highlighted code, and secure interactive playgrounds.

## Key release features

- Collapsible `VfAdminLayout` sidebars with controlled and uncontrolled state.
- Temporary sidebar expansion for pointer and keyboard interaction.
- Animated mobile navigation drawers with an accessible bars toggle, backdrop, Escape dismissal,
  and application-provided centered branding.
- Container-aware compact `VfNavMenu` navigation with smooth icon-only transitions.
- Optional controlled compact navigation for synchronization with parent sidebars.
- Named public TypeScript interfaces for `VfNavMenu` and `VfAdminLayout` props, slots, mobile-toggle
  attributes, and exposed methods.
- Public theme tokens for compact navigation geometry.
- Corrected temporary-expansion focus behavior and Switch thumb-icon contrast.

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
| Core                   | `2.1.1` |            Yes            |
| Layouts                | `2.1.1` |            Yes            |
| CodeBlock              | `4.0.0` |            No             |
| Playground Core        | `2.0.0` |            No             |
| Playground Vite Plugin | `1.0.0` |            No             |
| Playground             | `3.0.0` |            No             |

## GitHub Release description

The release workflow creates one GitHub Release for each Core and Layouts package tag and takes its
package changes from the matching `CHANGELOG.md` section. Use the following text as the project-level
introduction; package-specific changelogs remain the source of truth.

### VueForge 2.1.1

VueForge 2.1.1 completes the public TypeScript API for the responsive administrative sidebar and
container-aware compact navigation introduced in 2.1.0.
`VfAdminLayout` can manage desktop collapse and mobile drawer state internally or receive either
state from an application. Temporary pointer and keyboard expansion preserves access to the full
desktop sidebar.

Below the layout's own `lg` container breakpoint, the sidebar becomes an animated full-height drawer
with a built-in accessible bars toggle, backdrop, and Escape dismissal. Applications can supply the
centered mobile brand, replace the toggle, and retain their own trailing header content.

The `VfNavMenu` sidebar variant now transitions between full and icon-only presentations according
to its container width. Public theme tokens control the breakpoint, compact item geometry, and label
width, so applications can adapt the behavior without overriding component CSS.

This is a backward-compatible release. Upgrade Core and Layouts together:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.1.0 \
  @codemonster-ru/vueforge-layouts@^2.1.0
```

Read the
[coordinated release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
for the complete version matrix and package details.

## Release announcement

Use this announcement only after registry propagation, provenance, integrity, and fresh-consumer
checks have passed:

> VueForge 2.1.1 is available for Vue 3.5 applications. The patch exports named TypeScript
> interfaces for responsive NavMenu and AdminLayout props, slot scopes, mobile-toggle attributes,
> and exposed methods while preserving the 2.1 runtime behavior. Upgrade Core and Layouts together
> and see
> [the release notes](https://github.com/codemonster-ru/vueforge/blob/main/docs/release-notes.md)
> for the coordinated package versions.

## Change list

The authoritative coordinated change list is in [release-notes.md](./release-notes.md).
Package-specific change lists are in `packages/*/CHANGELOG.md` and are used directly by the release
workflow.
