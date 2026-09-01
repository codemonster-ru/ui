# Theme subsystem

Status: Accepted  
Date: 2026-09-01

## Decision

Theme is a three-state preference — `light`, `dark`, `system` — resolved in CSS first and JavaScript
second. The explicit choice lives in a cookie so the server can render it. `system` is expressed as a
media query so it resolves with no JavaScript at all. A controller in `ui-runtime` writes the
attribute and the cookie; the adapters bind the same state the components already bind.

`ThemeSwitch` is not a component to port. It is the visible control on a subsystem, and the
subsystem is what needs deciding.

## What already exists

The CSS contract is in place and unused. `packages/tokens` defines 231 tokens under
`:root, [data-cm-theme='light']` and 83 dark overrides under `[data-cm-theme='dark']`, and
`packages/css/src/foundation/document.css` sets `color-scheme: dark` for the dark root.

Nothing on the CodeMonster side implements any behavior: there is no provider, no controller, and no
switch. `VfThemeProvider` is the VueForge implementation, and it reads `localStorage`, falls back to
an attribute already on the root, then to a default, watching `matchMedia` for the `system` case.

## Why VfThemeProvider is not carried across as-is

**`system` has no CSS path.** There is no `prefers-color-scheme` query anywhere in the tokens or the
CSS package, so `system` resolves only when JavaScript runs. In a kit whose premise is that the
server emits markup that already works, the most commonly chosen theme setting is the one that does
not work without scripting. A visitor who has never opened the switch, on a machine set to dark, is
served light until JavaScript loads — and permanently, if it does not.

**Every write happens after mount.** The provider stamps the resolved theme in `onMounted`, so a
server-rendered page paints the default first and corrects itself afterwards. That is the flash, and
it cannot be fixed while the preference lives in `localStorage`, because the server cannot read it.

## The decision in three parts

### The explicit choice lives in a cookie

A cookie is readable by PHP and by Node during SSR, so the server stamps `data-cm-theme` into the
HTML it emits and the first paint is already correct.

The usual alternative is a small blocking script in `<head>` that reads `localStorage` before the
first paint. It works, and it is what most libraries do. It is rejected here as the default because
the Razor adapter would have to emit it too, and this repository's position is that the server sends
working markup rather than a script that repairs markup.

The cost, plainly. HTML that varies by cookie needs `Vary: Cookie`, and that is what breaks CDN
caching of whole pages — a statically generated site cannot take this path at all without an edge
function. This is the real objection, and it is worth more than the bandwidth of the cookie itself,
which is negligible. The cookie also needs a deliberate `SameSite` and `Path`.

It is accepted anyway because both first-class adapters are server-rendered: a PHP application and
Vue SSR emit dynamic HTML already, so they have a server that can be correct on the first paint. A
purely static host has none, and there the blocking script stays available as a documented fallback
rather than the default path.

Note how much the media query below narrows this. Once `system` resolves in CSS, the store only
matters for someone who explicitly chose a theme that differs from their operating system — a
minority of visitors, on a decision that no longer affects everyone else.

### `system` becomes a media query

The tokens gain a dark block behind `prefers-color-scheme`, guarded so that an explicit choice still
wins in both directions:

```css
:root,
[data-cm-theme='light'] {
  /* light tokens */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-cm-theme='light']) {
    /* dark tokens */
  }
}

[data-cm-theme='dark'] {
  /* dark tokens */
}
```

This is what makes `system` work with scripting disabled, and it makes the no-attribute case correct
rather than merely light.

It duplicates the 83 dark declarations. Measured on the built file: `tokens.css` goes from 18,763 to
24,759 raw bytes, and from 2,620 to 3,049 gzipped — 429 bytes over the wire. A first estimate of 61
bytes was taken by concatenating the block to itself, which compresses almost perfectly; the real
copy is indented one level deeper inside the media query, and that is enough to cost real bytes.
The file is generated, so the duplication is a build detail rather than something anyone maintains
twice.

`light-dark()` would express both values in one declaration and remove the duplication outright. It
is not taken here because it moves the whole token model onto `color-scheme` and a newer baseline
than this kit currently assumes; it is the obvious simplification to revisit.

### The behavior splits the way every other component splits

- `runtime/src/core/theme.ts` — `resolveTheme(mode, systemTheme)`, `isThemeMode`, and the attribute,
  cookie, and storage names. Pure functions over plain data, as the other core modules are.
- `runtime/src/theme.ts` — a controller that toggles the mode, writes the attribute and the cookie,
  and subscribes to `matchMedia` only while the mode is `system`.
- `ui-vue` — `CmThemeSwitch`, binding the same state and claiming its root with `data-cm-hydrated`.
- `Codemonster\Ui` — `CmThemeSwitch` renders the same canonical markup, and `Support\Theme` reads the
  cookie so a layout can stamp the attribute on `<html>` before the first paint.

## Consequences

- The server becomes able to render the correct theme, which is the point. A page rendered by PHP
  with no JavaScript at all honors both an explicit choice and the operating system preference.
- `data-cm-theme` becomes a documented part of the canonical DOM contract rather than an attribute
  the tokens happen to key off.
- The cookie is a new piece of public surface: its name, and its `SameSite` and `Path`, are API and
  need to be configurable without being easy to get subtly wrong.
- A behavior scenario covers the switch like any other interactive component, and the parity harness
  replays it against both adapters.
- The `vf-theme` key and `data-vf-theme` attribute stay untouched. This is a separate subsystem under
  a separate name, and the VueForge line keeps its own.

## What would change this decision

- A consumer needs the theme on a host that cannot set or read cookies, and the static fallback
  proves to be the common case rather than the exception. The store would then move to
  `localStorage` plus the blocking script, and the CSS half of this decision would still stand.
