# Security audit exceptions

`npm run audit:release` runs two gates, and both must pass:

1. `npm audit --omit=dev`: the production dependency graph must have **no** known
   vulnerability of any severity. No exception applies here.
2. `node ./scripts/ci/audit-gate.mjs`: the full graph, development dependencies
   included, must have no high or critical advisory. The only exceptions are the ones in
   [`scripts/ci/audit-exceptions.json`](../scripts/ci/audit-exceptions.json), and each
   one is accepted only while every condition below still holds.

Moderate and low advisories are reported but do not block, as under the previous
`npm audit --audit-level=high`.

## How the gate decides

The gate reads `npm audit --json` and fails closed:

- Every high or critical entry must trace, through npm's `via` chain, only to excepted
  advisories. npm reports packages that merely depend on a vulnerable package (for
  example `stylelint` through `micromatch`) as vulnerable themselves; each of those must
  be named in the exception's `propagatesTo` list and must have no high advisory of its
  own.
- An advisory matches an exception only on all of its GHSA id, npm source id, package,
  severity and vulnerable range. Any other advisory on an excepted package fails the
  gate, whatever its severity.
- The excepted package must be installed only at the listed lockfile nodes and versions,
  be required only by the listed dependents, and be `dev` only in `package-lock.json`, as
  must every package it propagates to.
- The gate fails when an exception is no longer needed (the advisory is gone), when the
  advisory changes (for example its vulnerable range, once a patched version is listed), when
  the registry publishes a newer version of the package or of a package that requires it, when
  npm reports `fixAvailable: true`, and on the day after `reviewBy`. The review window is at
  most 120 days.
- npm also proposes changes to direct dependencies as `fixAvailable`. These are reported but
  never decide the gate: on an unchanged tree consecutive audits returned `false`,
  `markdownlint-cli2@0.21.0` and `stylelint-config-standard@15.0.1` for braces, and both
  downgrades keep `micromatch` → `braces`.
- Malformed or inconsistent npm output, a failed npm run, or a check that did not
  complete is a failure, never a pass.

`npm run test:audit-gate` (part of `npm run check`) holds the negative controls: it feeds
the gate captured npm output with one change each and requires a failure.

## Accepted exceptions

### GHSA-vfj7-8cjw-p6xm: braces

| Field               | Value                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advisory            | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), CVE-2026-93687, high (CVSS 7.5), npm source 1240992                             |
| Package             | `braces@3.0.3` at `node_modules/braces`; vulnerable range `<=3.0.3`                                                                                       |
| Dependency path     | `micromatch@4.0.8` → `braces@3.0.3`, where `micromatch` is used by `stylelint` (directly and through `fast-glob` and `globby`) and by `markdownlint-cli2` |
| Production exposure | None. All of these packages are `dev` in the lockfile, `npm audit --omit=dev` reports nothing, and no published VueForge package depends on them          |
| Accepted            | 2026-10-11 (M35.6c)                                                                                                                                       |
| Review by           | 2027-01-11; the gate fails from 2027-01-12                                                                                                                |

**Why it is accepted.** The advisory describes stack exhaustion when braces expands a
deeply nested pattern. There is no fixed release: 3.0.3 is the latest version of braces,
the maintainer has declined to publish a patch, and a request to withdraw the advisory is
open as github/advisory-database#10132. `micromatch@4.0.8`, also the latest release,
requires `braces ^3.0.3`, and every consumer listed above is already at its latest version,
so no update removes the path. Replacing stylelint and markdownlint-cli2 is out of
proportion to the risk. Here braces only expands glob patterns written in this
repository's own lint configuration and npm scripts; no untrusted input reaches it.

**When it ends.** Remove the exception, and the gate requires it, as soon as any of these
happens:

- the advisory is withdrawn or no longer reported;
- the advisory changes, npm reports `fixAvailable: true`, or a version of braces newer than
  3.0.3 or of micromatch newer than 4.0.8 is published;
- the dependency path changes (a new consumer, a different micromatch, another braces
  version or location), or braces reaches the production graph;
- 2027-01-11 passes without a renewed review.

Renewing needs a fresh review of the advisory and the dependency path, a new `acceptedAt`
and `reviewBy` in `audit-exceptions.json`, and an update of this page.
