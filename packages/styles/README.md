# @codemonster-ru/vueforge-styles

Future single owner of the shared VueForge CSS: foundation, component and region
stylesheets, and their import graph.

**Status: owns the VfInput CSS dependency closure.** M02 created the boundary;
M04 moved the first closure into it, unchanged.

## What lives here

`src/components/` holds the canonical source of:

- `input.css` — the `.vf-input` / `.vf-input-wrap` rules, sizes, states,
  adornment layout and the floating-label selectors;
- `field.css` — imported by `input.css`, and the reason floating labels work;
- `icon-button.css` — imported by `input.css` for the clear and reveal actions;
- `button.css` — the `.vf-button` rules, variants, sizes, block and loading;
- `progress-spinner.css` — imported by `button.css`, and the reason a loading
  button has a spinner. Not a migrated component of its own: it is the loading
  affordance the button composes, so its rules travel with the button;
- `textarea.css` — the `.vf-textarea` rules, sizes, states and the floating
  selectors it shares with `field.css`, which it imports.
- `checkbox.css`, `radio.css`, `switch.css` — the three checkable controls.
  Each is a standalone closure importing nothing, so each moved as one file.

That is the declared `@import` closure of `input.css` and of `button.css`, and
nothing more. The
foundation, tokens and accessibility preferences stay in `packages/core`: every
component depends on them, so moving them would drag the whole cascade instead
of one coherent closure.

More closures arrive one component at a time, transferred without redesign.
Class names (`.vf-*`), custom properties (`--vf-*`), semantic tokens, theme
attributes and presets are never renamed as part of a move.

## How consumers still reach it

`packages/core/src/styles/entries/{input,field,icon-button,button,progress-spinner,textarea,checkbox,radio,switch}.css` are single-line
forwards to the files above. Every existing path keeps working untouched: the
`@codemonster-ru/vueforge-core/input.css` subpath, the browser auto-CSS entries,
`styles.css`, and the core entries that import `./field.css`, `./icon-button.css`,
`./button.css` or `./progress-spinner.css` - confirm-dialog, date-picker,
theme-switch, group-box and data-table among them. The build inliner resolves the forward, so the emitted
stylesheets are byte-identical to the reference.

There is exactly one editable copy of every rule. `npm run check:boundaries`
fails if a forward grows rules of its own or points somewhere else, and
`npm run baseline:css` rebuilds `packages/core` from an immutable checkout of the
reference commit and compares all 52 emitted stylesheets byte for byte.

## What must never be here

Vue, Razor, the adapter packages, the showcase, or any compensating offset that
makes a demo look better than the real component. Tokens come from
`@codemonster-ru/vueforge-theme`; nothing flows the other way.

## Enforcement

`npm run check:boundaries` fails if anything under this package imports Vue, the
Vue adapter packages, the Razor adapter or the showcase. The check runs over
git-tracked files only.

Private and unpublished until a real consumer exists.
