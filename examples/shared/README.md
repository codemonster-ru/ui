# examples/shared

Plain-data index shared by the two showcase applications.

Everything here is data or prose. No Vue, no PHP, no renderer, no executable
code: `npm run check:boundaries` fails if a file with any other extension
appears, the same rule that protects `contracts/`. A showcase index that could
import one adapter would stop describing the product and start describing that
adapter.

## Why an index at all

The migration runs two native applications rather than one application that
switches renderer (architecture plan, section 15):

| Application | Path | Renders with |
| --- | --- | --- |
| Vue showcase | `examples/playground`, route `/input` | The real `@codemonster-ru/vueforge-core` components |
| Razor showcase | `examples/razor-showcase` | The real `codemonster-ru/vueforge-razor` provider through the Razor engine |

Two independent applications drift. This file is the single place that says
which components exist, which platform implements which, and where the case
data for a component lives, so neither application can invent a component, hide
one, or claim support it does not have.

## `showcase-index.json`

| Field | Meaning |
| --- | --- |
| `referenceCommit` | The commit whose public catalog this index mirrors. |
| `urlContract.parameters` | `component`, `case` and `theme`, accepted identically by both applications, which is what makes a case address portable. |
| `urlContract.platforms` | Where each application lives, so one can link to the other. |
| `components[].name` | A public component name from the frozen catalog. |
| `components[].platforms.vue` / `.razor` | `implemented` or `not-implemented`. |
| `components[].showcase.caseSource` | For a component whose cases are addressable, the file that owns them. |

The component list is not authored here in the sense of being invented here: it
is the frozen public catalog of the reference commit, and
`npm run showcase:routes` fails if it drifts from
`baseline/reference-inventory.json`. Adding a component to this file does not
make it exist.

## What is deliberately not here

**Case data.** `VfInput` cases live in `contracts/input/cases.json` and are
referenced by `caseSource`. Copying them here would create a second list that
can silently disagree with the one the parity gate uses.

**Rendering.** Each application maps a case onto its own native template. Vue
examples stay ordinary Vue; Razor examples stay ordinary Razor. No callback,
slot, render function or expression is serialised into JSON to make the
showcase generic (architecture plan, section 15).

**Support claims.** `not-implemented` is the honest default. A component
without a Razor adapter still appears in both catalogs, marked unsupported, and
is never counted as parity-supported. There is no placeholder markup standing in
for a missing adapter.
