---
title: 'CodeMonster UI'
description: 'Cross-platform design-system components for Vue and Annabel Razor'
order: 1
---

# CodeMonster UI

CodeMonster UI is a shared design system for Vue 3 applications and server-rendered Annabel Razor
templates. Framework-independent tokens, CSS, canonical HTML, and interaction contracts keep both
adapters aligned without hiding their native composition models.

## Start here

- [Install CodeMonster UI for Vue or Razor](./getting-started.md).
- [Configure design tokens and themes](./tokens/getting-started.md).
- [Load the shared CSS](./css/getting-started.md) or review its [utility contract](./css/utilities.md).

## Components

- [Button](./components/button.md), [Card](./components/card.md), and
  [display components](./components/display.md).
- [Forms](./components/forms.md) and [advanced inputs](./components/advanced-inputs.md).
- [Navigation](./components/navigation.md) and [Accordion](./components/accordion.md).
- [Overlays](./components/overlays.md).
- [Table and DataTable](./components/data-tables.md).
- [Layout primitives](./components/layout-primitives.md).

Every component guide documents both Vue and Razor. Interactive Razor examples identify the
specific `@codemonster-ru/ui-runtime` controller required for progressive enhancement; Vue
components own their interaction directly.

## Architecture and support

- [Package boundaries](./architecture/package-boundaries.md) and
  [rendering strategy](./architecture/rendering-strategy.md).
- [Platform support](./architecture/platform-support.md) and
  [browser and CSS support](./architecture/browser-and-css-support.md).
- [Accessibility requirements](./architecture/accessibility-requirements.md) and
  [HTML security](./architecture/html-security.md).

## Migrating from VueForge

Use the [package and component mapping](./vueforge-to-codemonster-ui.md) with the
[migration policy](./architecture/vueforge-migration-policy.md). VueForge Core and Layouts pages
under `docs/core` and `docs/layouts` remain legacy reference material during the maintenance
window. Icons, CodeBlock, Playground, and application shells retain their separately documented
ownership and are not represented as CodeMonster UI replacements.
