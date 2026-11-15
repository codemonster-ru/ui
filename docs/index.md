---
title: 'CodeMonster UI'
description: 'Cross-platform design-system components for Vue and Vanilla HTML'
order: 1
---

# CodeMonster UI

CodeMonster UI is a shared design system for Vue 3 applications and Vanilla HTML pages, including server-rendered templates. Framework-independent tokens, CSS, canonical HTML, and interaction contracts keep both
adapters aligned without hiding their native composition models.

## Start here

- [Install CodeMonster UI for Vue or Vanilla](./getting-started.md).
- [Run the Vue or Vanilla showcase locally](../README.md#preview-locally).
- [Choose the stable 1.1 release or a local 2.0 build](./getting-started.md#choose-a-release).

## Components

[Browse the component reference](./components/index.md) for Vue usage and the equivalent
Vanilla HTML for every shared component. Start with [Button](./components/button.md),
[forms](./components/forms.md), [overlays](./components/overlays.md), or
[Table and DataTable](./components/data-tables.md).

## Integration

- [Serve Vanilla assets and manage dynamic HTML](./vanilla.md).
- [Integrate forms, overlays, and server-rendered pages](./integration.md).
- [Configure design tokens and themes](./tokens/getting-started.md).
- [Load shared CSS](./css/getting-started.md) and [generated utilities](./css/utilities.md).
- [Migrate an existing VueForge app](./migrate-from-vueforge.md).

## Maintained recipes

- [Confirm dialog](./recipes/confirm-dialog.md), [Group box](./recipes/group-box.md), and
  [Panel](./recipes/panel.md).
- [Form layout](./recipes/form-layout.md), [Page header](./recipes/page-header.md), and
  [Theme switch](./recipes/theme-switch.md).
- [Auth layout](./recipes/auth-layout.md), [Error layout](./recipes/error-layout.md), and
  [Skeleton gate](./recipes/skeleton-gate.md).
- [Code Block](./recipes/code-block.md) and [Playground](./recipes/playground.md).

## Architecture and support

- [Package boundaries](./architecture/package-boundaries.md) and
  [rendering strategy](./architecture/rendering-strategy.md).
- [Platform support](./architecture/platform-support.md) and
  [browser and CSS support](./architecture/browser-and-css-support.md).
- [Accessibility requirements](./architecture/accessibility-requirements.md) and
  [HTML security](./architecture/html-security.md).

## VueForge

CodeMonster UI succeeds VueForge, the Vue-only line this project migrated from. VueForge is
sunset: its packages and documentation moved to
[`codemonster-ru/vueforge`](https://github.com/codemonster-ru/vueforge) and are no longer developed
here. See [icon line ownership](./architecture/icon-line-ownership.md),
[layout line ownership](./architecture/layout-line-ownership.md),
[playground ownership](./architecture/playground-ownership.md), and
[CodeBlock ownership](./architecture/codeblock-ownership.md) for what carried across and why.
