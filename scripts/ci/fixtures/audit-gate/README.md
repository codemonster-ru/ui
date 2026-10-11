# Audit gate fixtures

Real npm output for this repository, captured on 2026-10-11 (M35.6c) with Node 24.19 and
npm 11.17 after `npm ci`, on the dependency graph that introduced the braces exception.
`audit-gate.test.mjs` starts every case from these files and changes one thing.

| File                       | Source                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `full-audit.json`          | `npm audit --include=dev --json`                                                   |
| `production-audit.json`    | `npm audit --omit=dev --json`                                                      |
| `lockfile.json`            | `package-lock.json`, reduced to the root entry and every node the full audit names |
| `braces-versions.json`     | `npm view braces versions --json`                                                  |
| `micromatch-versions.json` | `npm view micromatch versions --json`                                              |

The fixtures describe that moment, not the current lockfile, so they do not need to change
with it. Recapture them only when the gate's rules change.
