---
title: 'Getting started'
description: 'Overview and purpose of the layouts package'
order: 1
---

# Getting started

Layouts provides responsive primitives and app-shell, document, setup, auth, and error shells for
Vue 3.5 applications. It uses Core as a peer for shared theme and foundation contracts.

The package uses explicit CSS entry points (base/tokens/theme + per-layout entries).
Consumer apps can keep global CSS minimal and load layout styles only where needed.

Continue with:

- [Installation](./installation.md) for the required Core peer, npm/pnpm/Yarn commands, CSS
  strategies, and SSR setup.
- [Container](./components/container/index.md) for a small layout primitive.
- [App Shell](./components/app-shell/index.md) or
  [Admin Shell](./components/admin-shell/index.md) for application-level composition.
- [Public API](./api/index.md) for all components, theme helpers, and responsive composables.
