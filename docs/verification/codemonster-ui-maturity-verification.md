# CodeMonster UI maturity verification

Status: Complete  
Date: 2026-08-15  
Roadmap item: `CMUI-190`

## Outcome

The complete portable cohort, retained side-by-side products, migration tooling, and both
representative consumers pass together. The registry contains 37 direct replacements, 8 maintained
compositions, 18 manual/application-owned outcomes, and no unresolved coverage or backlog gaps.

## Verification matrix

| Surface                       | Verification                                                                                                            | Result                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| CodeMonster UI packages       | Tokens, runtime, CSS, utilities, and Vue workspace checks                                                               | 5 workspaces; 419 tests passed                                                 |
| Contracts and adapters        | Manifests, canonical HTML, behavior, selectors, Vue SSR, Razor parity, and packaged assets                              | 37 manifests; 110 canonical cases; 45 behavior scenarios; 38 selector suites   |
| Accessibility and visuals     | Canonical axe/relationship checks and theme/viewport fixture generation                                                 | 110 accessible cases; 440 visual permutations                                  |
| Package budgets               | Published tokens, runtime, CSS, utilities, and Vue entries                                                              | All 5 budgets passed                                                           |
| Annabel Razor package         | PHPStan, PHPUnit, archive/install smoke, rendering, and asset publication                                               | 203 tests; 427 assertions; exact archive consumed                              |
| Real Annabel CMS baseline     | Read-only unit suite against the recorded real consumer checkout                                                        | 42 tests; 94 assertions                                                        |
| Representative Vue playground | ESLint, Vue typecheck, application shell/theme tests, and production build                                              | 4 tests; 579 transformed modules; build passed                                 |
| Documentation and migration   | Documentation contracts/examples, import ownership, frozen baseline, mapping, coverage, codemod/checker, and formatting | 469 Markdown files; 257 executable fixtures; 63 dispositions; all gates passed |
| VueForge regression suites    | Migrated Core, Layouts, and Theme foundations plus retained Icons, CodeBlock, and Playground product checks             | All VueForge package suites passed                                             |
| Packed npm consumers          | Retained products, CodeMonster UI packages, CSS exports, tree-shaking, and deferred budgets                             | 8 retained and 5 UI tarballs consumed; all budgets passed                      |

The package and contract gates must run sequentially when they both rebuild shared `dist` trees;
the final recorded runs were sequential and clean. `git diff --check` and the final worktree check
also passed.

## Consumer boundary

The Vue playground has no direct `vueforge-core` or `vueforge-layouts` dependency and is guarded by
the migration exit test. Retained Icons, CodeBlock, and Playground products remain explicit
side-by-side dependencies and keep only their own documented `vf` hooks.

The real Annabel Razor surface continues to require only Container, Stack, and Card. Its absence of
shell/navigation demand is evidence for the application-owned boundary, not a reason to invent an
adapter API. The packed-consumer gate separately proves that the complete current Razor package can
be archived, installed, rendered, and publish its exact CSS assets.

## Stable cohort publication

The matured cohort was subsequently published to npm and Packagist, then installed from those
registries by clean synthetic consumers and the real Annabel CMS. Exact versions, registry hashes,
release and workflow URLs, signature and provenance counts, Razor dependency evidence, and final
Annabel results are recorded in
[CodeMonster UI 1.1 registry validation](./codemonster-ui-1.1-registry-validation.md).
