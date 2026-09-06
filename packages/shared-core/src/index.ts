// Public entry of the platform-neutral shared core.
//
// M02 establishes this package as an architectural boundary only. Nothing has
// been extracted into it yet: pure Input calculations arrive in M05, and every
// later component follows the same route. Adding code here ahead of a real
// second consumer is exactly the "more scaffolding than transferred behaviour"
// anti-pattern the architecture plan warns about (section 21).
//
// The boundary this file anchors is enforced by
// scripts/ci/check-architecture-boundaries.mjs: nothing under this package may
// import Vue, the Vue adapter packages, the Razor adapter, the showcase, or
// browser globals.
export {};
