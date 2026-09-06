# Reference baseline harness (M00 / M01)

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
| `npm run baseline:showcase:ci`              | Fresh immutable reference → current captures on the same runner; zero tolerated differences, no baseline rewriting.                        |
| `npm run baseline:input`                    | Runs the VfInput characterization suite unmutated, then once per known regression, and requires every mutation to be detected.             |
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

## VfInput characterization (M01)

`packages/core/src/components/input/VfInput.characterization.spec.ts` records the
observable behaviour of the historical `VfInput` before any extraction:
props/defaults, sizes, invalid state, plain and adorned DOM, adornment ordering,
the leading/trailing slots, native attribute and type forwarding, clear, password
reveal, caret and selection direction, field and floating-field integration,
consumer class/style placement, external model updates and the accessibility
relationships.

`packages/core/src/__tests__/fixtures/HistoricalInputConsumer.vue` is an
unchanged historical consumer kept as a compile-and-run fixture. It must keep
type-checking under `vue-tsc` and keep working; an edit forced on it by a
migration step is itself the regression.

`npm run baseline:input` is the negative fixture. `input-mutations.mjs` lists
twelve defects the first migration actually shipped - dropped `leadingIcon` and
`trailingIcon`, a normalised native `type`, consumer `class`/`style` moved onto
the input, changed clear emission and focus behaviour, a clear control on
readonly inputs, lost selection restore and direction, removed field injection,
a missing `data-vf-filled` and an always-on floating state. Each is applied in
memory by a Vite plugin, so `VfInput.vue` on disk is never modified; the run
verifies that afterwards with a hash and a `git diff`.

A mutation run has three outcomes, not two. Until M07.1 the driver read any
non-zero exit as a detection, so a mutation whose search text no longer matched
the source made the plugin throw, vitest exit non-zero, and the gate print
`detected` - coverage could rot to nothing while the gate stayed green. Now the
driver checks every needle against the source _before_ running anything and
fails on a stale one, and the plugin records that it really rewrote the module,
so "applied and the suite failed" is distinguished from "the run failed for some
other reason". Detection also requires completed failing assertions in the
Vitest JSON report; a build/load error or killed test process does not count.
`npm run baseline:input:self-test` invokes the real driver with an impossible
needle and requires exit 1 with `MUTATION_COULD_NOT_BE_APPLIED:STALE` and no
detection. It also checks assertion/load/process failure classification.

## CI reference checks (M07.1)

Both CI jobs fetch full history and run `check:reference` before dependencies.
The validation job reaches `baseline:inventory`, `baseline:test`,
`baseline:input:self-test`, `baseline:input`, `baseline:css`, `parity:input`, and
`parity:input:mutations`, alongside the existing boundaries/core/shared/Razor
checks. The `showcase-baseline` job runs `baseline:showcase:ci` on every pull
request. Its fresh reference and current captures use the same host/browser and
compare all 24 captures, all route cases, fonts and layout, with zero drift.

`baseline:showcase` and `baseline:showcase:current` retain their original
recorded-baseline checks. Run those in the recorded Chrome 152 / darwin-arm64
environment described in the architecture plan. Their stored hashes cannot
meaningfully pass on Ubuntu. CI instead creates temporary comparison evidence
from the immutable reference; it never updates `baseline/reference-showcase.json`.
The job uploads captures and the machine-readable `comparison.json` report.

## Recorded historical defects

Found during characterization, asserted as-is and deliberately **not** fixed:

1. A consumer `style` is dropped entirely on a plain, non-adorned `VfInput`.
   `inheritAttrs` is false, `style` is excluded from the forwarded attributes,
   and only the wrapper branch binds `:style`, so the style survives only when
   the input happens to be adorned.
2. Clearing an input whose only adornment is the clear control collapses the
   conditional wrapper and replaces the `<input>` element, so the synchronous
   `focus()` in `handleClear` is lost and focus lands on `<body>`. With any other
   adornment present the element survives and focus is retained.
3. `disabled`/`readonly` are read through a strict truthiness check
   (`true`, `""`, `"true"`), so the HTML idiom `disabled="disabled"` does not
   suppress the clear control.
4. Forwarded attributes are bound after the computed `aria-invalid`, so a
   consumer-supplied `aria-invalid` overrides the `invalid` prop.
5. `packages/icons/src/App.vue` declares no `<slot>` outlets, so the
   `#saas-contexts` content that `IconsShowcase.vue` passes is never rendered on
   `/icons`. The route baseline reflects the rendered DOM.
6. The shared core test setup mocks the icon registry with `chevronDown` only,
   which makes `icons.eye`, `icons.eyeSlash` and `icons.xmark` indistinguishable
   `undefined` values. The characterization suite installs its own registry so
   the glyph contract is observable; the shared setup is left unchanged.

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
