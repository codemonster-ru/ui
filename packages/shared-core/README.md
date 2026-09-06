# @codemonster-ru/vueforge-shared-core

Platform-neutral rules and contracts shared by the existing Vue adapter and the
future Razor browser adapter.

**Status: architectural boundary only.** M02 created this package to fix the
dependency direction before any migration step moves code. It intentionally
exports nothing yet.

## What belongs here

Pure value rules and types that two real adapters use — extracted from the
reference implementation, never re-designed. The first arrivals are the pure
`VfInput` calculations in M05: clear eligibility, derived adornment state and
password action metadata.

## What must never be here

Vue (refs, computed, watch, provide/inject, composables, SFCs), PHP or Razor
code, DOM access, browser globals, rendering, component registries, plugin
lifecycle, or a helper whose only consumer is a single component. A helper with
one consumer stays next to that component.

## Enforcement

`npm run check:boundaries` fails if anything under this package imports Vue, the
Vue adapter packages (`core`, `layouts`, `icons`, `codeblock`, `playground*`),
the Razor adapter, the showcase, or uses browser globals. The check runs over
git-tracked files only.

Private and unpublished: it has no consumer yet, and
`scripts/ci/prepare-release-from-tag.mjs` refuses to release a private package.
