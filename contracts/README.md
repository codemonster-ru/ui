# contracts

Shared, plain-data descriptions of historical VueForge behaviour.

Everything here is data or prose. No Vue, no PHP, no renderer, no executable
code: `npm run check:boundaries` fails if a file with any other extension
appears. That rule exists because the moment a specification imports one
adapter, it stops describing the product and starts describing that adapter.

## `input/`

| File | Purpose |
| --- | --- |
| `cases.json` | The shared VfInput cases every adapter renders. |
| `parity-policy.json` | How each comparison dimension is classified, how the historical quirks are classified, and the complete list of tolerated differences. |

The vocabulary is the historical Vue contract at
`fd793696f50d3be0fcd3788f0f8f751c63869963`, because the reference defines the
baseline. Each adapter maps the neutral fields onto its own API — the Razor
adapter spells `modelValue` as `value`, for instance. Adding a case describes
behaviour the reference already has; it never introduces new product behaviour.

Case ids are stable and hierarchical (`input/clearable-filled`), so they can
address the same case from a report, a test failure and, later, a showcase link.

## What the policy is for

Three classifications decide how a difference is treated:

- **exact** — must match literally across every target;
- **semantic** — framework mechanics may differ, observable meaning may not;
- **framework-specific** — historical behaviour of one adapter that the other is
  not required to reproduce.

A difference that is not listed in `approvedDivergences` fails the gate. That is
the whole point: a comparison harness is only worth having if it cannot be
talked into calling two different implementations equal.

## Shape of an approval

An independent review of M07 proved that a registry is only as good as the
constraints the code actually enforces: a `dom.structure` entry with
`caseId: "*"`, no path and a decorative `scope` field turned out to disable DOM
comparison entirely for six cases, and four wrong native attributes produced a
clean PASS. Every field below is now validated by
`scripts/parity/compare.mjs`, and the gate refuses to run against a registry
that breaks any of these rules:

| Field | Rule |
| --- | --- |
| `id` | Required and unique. The report attributes every tolerated difference to it. |
| `dimension` | Must exist in `dimensions`. `dom.structure` may never be approved: an intentional divergence gets its own named dimension, an unexplained one has to fail. |
| `target` | Exactly one of `reference`, `current`, `razor`. No wildcard. |
| `caseIds` | A non-empty, explicit list of case ids that exist in `cases.json`. No wildcard. |
| `pathSelector` | Required for anything anchored to an element. Matched **exactly** against the element the difference is on — not as a substring of the path, so an approval written for `span.vf-icon-wrapper` never covers the `svg` inside it. |
| `detail` | Optional, matched exactly (an attribute name, for instance). |
| `expectedOccurrences` | How many differences this rule is allowed to tolerate across the whole run. A rule that matches nothing, or matches more than this, fails the gate. |
| `reason` | Prose. Why this specific difference is not a defect. |

Unknown fields are rejected, so a constraint that looks like it is enforced
cannot be one the code ignores.
