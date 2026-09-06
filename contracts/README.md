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
