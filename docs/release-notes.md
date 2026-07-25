# VueForge Core and Layouts 2.1.1 release notes

VueForge 2.1.1 completes the public TypeScript API for the responsive administrative navigation
introduced in 2.1.0. It is a backward-compatible declaration-only API addition.

## Current package versions

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

## Highlights

- Core exports `VfNavMenuProps` from the package root and `nav-menu` subpath.
- Layouts exports `VfAdminLayoutProps`, `VfAdminLayoutScope`,
  `VfAdminLayoutMobileSidebarScope`, `VfAdminLayoutMobileToggleAttrs`, and
  `VfAdminLayoutExposed` from the package root and `admin-layout` subpath.
- Published declarations now match the named slot-scope contracts described by the documentation.
- `VfAdminLayout` supports controlled and uncontrolled sidebar collapsing, manual slot controls,
  and temporary pointer or keyboard expansion.
- Below its own `lg` container breakpoint, `VfAdminLayout` replaces the desktop sidebar with an
  animated full-height drawer, built-in accessible bars toggle, backdrop, and Escape dismissal.
- Mobile navigation has independent controlled and uncontrolled state, while `mobile-brand` and
  `mobile-toggle` slots let applications supply branding or replace the built-in control.
- The `VfNavMenu` sidebar variant responds to its container width and switches to an icon-only
  presentation in compact sidebars.
- `VfNavMenu` also accepts a controlled `compact` prop when its label transition must be synchronized
  with a parent sidebar; automatic width detection remains the default.
- Compact navigation geometry is configurable through public theme tokens instead of fixed
  component values.
- Sidebar labels, branch content, indicators, and brand examples transition without wrapping or
  abrupt layout changes.
- Pointer-activated navigation no longer leaves a temporarily expanded sidebar pinned after the
  pointer exits.
- Switch thumb icons retain readable contrast in their active states.

## Compatibility

This release has no breaking API changes. Applications using the new `VfAdminLayout` responsive
sidebar behavior should upgrade Core and Layouts together:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/vueforge-core@^2.1.0 \
  @codemonster-ru/vueforge-layouts@^2.1.0
```

Theme, Icons, CodeBlock, Playground Core, Playground Vite Plugin, and Playground have no runtime or
public API changes in this work and are not republished.

## New Core theme tokens

The compact `VfNavMenu` sidebar behavior can be customized with:

- `--vf-nav-menu-sidebar-compact-breakpoint`
- `--vf-nav-menu-sidebar-compact-item-width`
- `--vf-nav-menu-sidebar-compact-item-padding-inline`
- `--vf-nav-menu-sidebar-label-max-width`

The collapsed AdminLayout sidebar width remains configurable with:

- `--vf-layout-admin-layout-sidebar-collapsed-width`

## Package notes

- **Core 2.1.1:** exports the public `VfNavMenuProps` interface.
- **Layouts 2.1.1:** exports the complete public `VfAdminLayout` props, slot-scope, mobile-toggle,
  and exposed-method interfaces.

## Distribution and verification

The release gates cover:

- browser ESM, Node ESM, CommonJS, SSR, and declaration consumers;
- authoritative package exports and CSS entry points;
- component-subpath tree shaking and deferred runtime budgets;
- clean tarballs consumed through npm, pnpm, and Yarn;
- documentation imports, compiled examples, and generated fixtures;
- production and development dependency audits with zero known vulnerabilities;
- runtime, component, accessibility, theme-contract, and CSS-contract tests.

Package-specific changes are recorded in each package `CHANGELOG.md` and are used directly by the
tag-driven release workflow.
