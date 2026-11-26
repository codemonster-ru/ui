---
title: 'CodeMonster UI documentation'
description: 'Cross-platform design-system components for Vue and Vanilla HTML'
order: 1
---

# Documentation

Use CodeMonster UI in Vue 3 or with Vanilla HTML. Both integrations share design tokens,
CSS, and component behavior, with support for server-rendered templates.

## Start here

- [Install CodeMonster UI](./getting-started.md#install-from-npm)
- [Vue quick start](./getting-started.md#vue-quick-start)
- [Vanilla quick start](./vanilla.md#quick-start)

Choose the [stable Vue 1.1 release](./codemonster-ui-1.1-release-notes.md) or use the [draft 2.0 packages](./codemonster-ui-2.0-release-notes.md) from this checkout. Both showcases can run locally from the repository. [Preview instructions](../README.md#preview-locally)

## Components

[Browse the component reference](./components/index.md) for Vue usage and the equivalent
Vanilla HTML for every shared component. Start with [Button](./components/button.md),
[forms](./components/forms.md), [overlays](./components/overlays.md), or
[Table and DataTable](./components/data-tables.md).

## Design foundations

- [Design tokens and overrides](./tokens/getting-started.md)
- [Theme selection and persistence](./recipes/theme-switch.md)
- [CSS and typography](./css/getting-started.md#typography)
- [Icons and accessible labels](./components/display.md#icons)
- [Layout primitives](./components/layout-primitives.md) and [application layouts](./components/layouts.md)

## Application integration

- [Serve Vanilla assets and manage dynamic HTML](./vanilla.md).
- [Integrate forms and overlays](./integration.md) or [render and hydrate on the server](./integration.md#server-rendering-and-hydration).
- [Use TypeScript with the public package entries](./integration.md#typescript).
- [Load shared CSS](./css/getting-started.md) and [generated utilities](./css/utilities.md).
- [Migrate an existing VueForge app](./migrate-from-vueforge.md).
- [Replace Panel with Card or Section](./recipes/panel.md).

## Maintained recipes

- [Confirm dialog](./recipes/confirm-dialog.md) and [Group box](./recipes/group-box.md).
- [Form layout](./recipes/form-layout.md), [Page header](./recipes/page-header.md), and
  [Theme switch](./recipes/theme-switch.md).
- [Auth layout](./recipes/auth-layout.md), [Error layout](./recipes/error-layout.md), and
  [Skeleton gate](./recipes/skeleton-gate.md).
- [Code Block](./recipes/code-block.md) and [Playground](./recipes/playground.md).

## Architecture and support

- [Reference quality roadmap](./reference-quality.md) and [component quality matrix](./components/quality-matrix.md).
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
