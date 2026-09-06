# @codemonster-ru/vueforge-styles

Future single owner of the shared VueForge CSS: foundation, component and region
stylesheets, and their import graph.

**Status: architectural boundary only.** M02 created this package to fix the
dependency direction before any stylesheet moves. It deliberately contains no
CSS yet, so the current CSS output, ordering, specificity and distribution are
byte-for-byte unchanged.

## What belongs here

The existing stylesheets, transferred without redesign. M04 moves the first
dependency closure — `input.css` together with `field.css`, `icon-button.css`
and the tokens they reach. `packages/core` and `packages/layouts` keep their
current `.css` export subpaths and build them from this single source; this is a
continuation of the existing distribution API, not a second implementation.

Class names (`.vf-*`), custom properties (`--vf-*`), semantic tokens, theme
attributes and presets are never renamed as part of a move.

## What must never be here

Vue, Razor, the adapter packages, the showcase, or any compensating offset that
makes a demo look better than the real component. Tokens come from
`@codemonster-ru/vueforge-theme`; nothing flows the other way.

## Enforcement

`npm run check:boundaries` fails if anything under this package imports Vue, the
Vue adapter packages, the Razor adapter or the showcase. The check runs over
git-tracked files only.

Private and unpublished until a real consumer exists.
