---
title: 'CodeMonster UI CSS'
description: 'Install and consume framework-independent CodeMonster UI styles'
order: 1
---

# CodeMonster UI CSS

`@codemonster-ru/ui-css` provides framework-independent document foundations, accessibility
preferences, and shared visual primitives. It contains no JavaScript runtime and no Vue, React, or
Angular dependency. The same CSS can be used by Vue applications, server-rendered Annabel Razor,
static HTML, and other platforms.

## Installation

Install the CSS package. Its compatible token package is installed automatically:

```bash
npm install @codemonster-ru/ui-css
```

```bash
pnpm add @codemonster-ru/ui-css
```

```bash
yarn add @codemonster-ru/ui-css
```

## Complete stylesheet

Load tokens first and the complete shared stylesheet second:

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
@import '@codemonster-ru/ui-css/styles.css';
```

`styles.css` composes the document foundation and every published shared primitive and component
style. Import it once. Do not combine it with `foundation.css` because the complete entry already
includes the foundation.

## Foundation-only stylesheet

Use the narrower entry when the application needs the reset, document defaults, focus rings, and
accessibility preferences but owns its component styling:

```css
@import '@codemonster-ru/ui-tokens/tokens.css';
@import '@codemonster-ru/ui-css/foundation.css';
```

Both entries use browser-readable relative imports. They do not require a Sass, PostCSS,
custom-media, CSS-in-JS, or framework build step.

## Themes

Light mode is the deterministic default. Put `data-cm-theme` on the document root when the initial
mode is known:

```html
<html data-cm-theme="dark">
  <body>
    Application
  </body>
</html>
```

Theme boundaries can also be nested:

```html
<main data-cm-theme="dark">
  <section class="cm-surface" data-cm-theme="light">Light preview</section>
</main>
```

Load application token overrides after `tokens.css` and before `ui-css` when source order should
make the ownership obvious. See [token and theme consumption](../tokens/getting-started.md) for the
complete override and serialization contract.

## Shared primitives

Primitives are optional visual classes, not components. Consumers remain responsible for semantic
HTML, labels, state attributes, and behavior.

```html
<button class="cm-control cm-control--sm" type="button">Save</button>

<section class="cm-surface cm-surface--elevated">Surface content</section>
```

Available control sizes are default, `cm-control--sm`, and `cm-control--lg`. Surface modifiers are
`cm-surface--subtle`, `cm-surface--elevated`, and `cm-surface--overlay`. The `cm-focus-ring` class
adds the shared ring to a custom focusable element; prefer native interactive elements whenever
they fit.

Do not add `aria-disabled` only for styling. A custom aria-disabled control still needs platform
behavior that prevents its action while preserving the keyboard and accessibility contract.

## Link tags and copied assets

Package CSS can be served without a JavaScript bundler. Preserve the relative file layout when
copying `dist`, then load the public entries in order:

```html
<link rel="stylesheet" href="/assets/codemonster-ui/tokens/tokens.css" />
<link rel="stylesheet" href="/assets/codemonster-ui/css/styles.css" />
```

`tokens.css` imports its sibling `breakpoints.css`; `styles.css` imports its sibling foundation and
part files. Copying only the two top-level files breaks those relative imports. Composer asset
publication must copy and integrity-check the complete package `dist` directories.

## SSR and Razor

CSS import order is identical for SPA, SSR, and no-JavaScript pages. Choose the initial
`data-cm-theme` value before rendering to avoid a mode change after first paint. Static and native
components need no client runtime; interactive Razor components add the optional CodeMonster UI DOM
runtime only when their behavior contract requires it.

## Public entries

| Entry                                   | Contents                                                              |
| --------------------------------------- | --------------------------------------------------------------------- |
| `@codemonster-ru/ui-css/styles.css`     | Foundation plus all shared primitives and component styles            |
| `@codemonster-ru/ui-css/foundation.css` | Reset, document, focus, reduced-motion, and forced-colors foundations |
