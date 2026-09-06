# Reference baseline harness (M00)

Machine-checkable oracle for the historical VueForge implementation at commit
`fd793696f50d3be0fcd3788f0f8f751c63869963` (**reference**). It exists so a later
migration step can be measured against the product that exists today, instead of
against a specification written after the fact.

Scope is deliberately narrow: the smallest reliable gate, not a generic
cross-platform testing platform. There is no Razor, React or Angular support
here, and no contract DSL.

## Commands

| Command                                     | What it does                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run baseline:inventory`                | Recomputes the public inventory from the working tree and compares it with `baseline/reference-inventory.json`.                            |
| `npm run baseline:inventory -- --write`     | Records the inventory. Refuses to run unless the tracked tree equals the reference commit.                                                 |
| `npm run baseline:showcase`                 | Builds and serves the reference from an immutable checkout, captures all six routes, and compares with `baseline/reference-showcase.json`. |
| `npm run baseline:showcase -- --write`      | Records the showcase baseline from the immutable reference checkout only.                                                                  |
| `npm run baseline:showcase -- --origin=URL` | Captures an already served candidate and compares it with the baseline. Cannot write.                                                      |
| `npm run baseline:control`                  | Reference → reference control run: two independent checkouts, two capture sets, zero tolerated differences.                                |
| `npm run baseline:test`                     | Unit tests proving the comparison fails on missing/unexpected cases, census loss, dimension mismatch and font drift.                       |

## Isolation

`isolated-reference.mjs` materialises the reference with `git archive` into its
own directory and clones `node_modules` from the repository install. The
`@codemonster-ru/*` entries inside `node_modules` are _relative_ symlinks, so
they re-point at the isolated packages; the harness asserts this before building
and fails if any of them still resolves into the working tree.

The shared working tree is never switched between capture steps, and no
implementation CSS from a later milestone can reach a historical page.

The isolated build also regenerates the gitignored `.generated/theme` CSS that
`packages/core` and `packages/layouts` produce at build time, so the checkout
needs no artifact copied in from the working tree.

## Provenance

Both baseline files record `referenceCommit`. The showcase baseline additionally
records the reference tree hash, the lockfile hash, the built `index.html` hash,
the browser build, the platform, the Node version, the emulated locale,
timezone, reduced-motion and colour-scheme settings, the viewport matrix and the
resolved font measurements per capture.

Current output can never become the baseline:

- `check-inventory.mjs --write` refuses when the tracked tree differs from the
  reference commit;
- `check-showcase.mjs --write` refuses `--origin` captures outright, so a
  baseline can only come from an immutable reference checkout.

Missing or unexpected captures and cases are failures. The comparison never
narrows itself to the intersection of the two sides.

## Determinism controls

The reference showcase has three real nondeterminism sources; the harness
controls the environment rather than masking components out of the frame:

1. `CoreShowcase.vue` drives a progress demo from `setInterval` + `Math.random`.
   The interval scheduler is frozen before any page script runs, so the demo
   stays at its initial value and the ProgressBar is still fully compared.
2. `LayoutsShowcase.vue` renders `new Date().getFullYear()`.
3. `VfDatePicker` highlights "today".

`Date` is pinned to 2025-01-01T00:00:00Z but still advances with
`performance.now()`, because `PlaygroundShowcase.vue` gates its ready events on
`Date.now()` deltas. `Math.random` is seeded.

## Known limitations

- **Fonts are host state.** The reference declares
  `Inter, ui-sans-serif, system-ui, …` and ships no `@font-face`. On the machine
  that recorded this baseline **Inter is not installed**: the probe measures the
  `Inter` stack at the forced serif fallback width (`227.18`) while the rendered
  body measures `257.38`, the same as `system-ui` and `BlinkMacSystemFont`. The
  showcase therefore renders with the system UI face here, not with Inter. The
  measured advance widths are stored per capture, so a host with Inter installed
  fails the gate with `resolved fonts changed` instead of producing unexplained
  pixel differences. The screenshot hashes in `baseline/reference-showcase.json`
  are therefore valid for the recorded environment only; another environment must
  re-record them under review and keep the provenance.
- Screenshot **hashes** are committed; the PNG files are written to the gitignored
  `.baseline-artifacts/` directory. Reviewing an actual pixel diff means keeping
  the artifacts from the two runs being compared.
- The route matrix is full-page, two viewports, two themes. Interaction states,
  accessibility and SSR are not covered here; they belong to the later gates in
  section 18.1 of the architecture plan.
- The harness drives a locally installed Chrome. `VUEFORGE_BASELINE_CHROME` sets
  the binary. Browser build changes are reported as environment drift.
