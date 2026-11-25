# CodeMonster UI 2.0 release plan

Prepare the seven npm packages for an unpublished stable `2.0.0` candidate. Preserve the
shared HTML, CSS and behavior contracts, progressive enhancement, and the Vue adapter API.
Keep the Vue and Vanilla production showcases in the browser test scope.

At intake, `main` was at `857c0e396077a7703a6b0b28c7c731fdb7f7befb`. The preparation used the
approved showcase integration from [PR #27](https://github.com/codemonster-ru/ui/pull/27).
The [reference integration record](../verification/reference-integration.md) covers its consolidation into `main`.
The [RC.2 report](../verification/codemonster-ui-2.0-rc.2.md) and
[design approval](../verification/visual-excellence-design-review.md) retain the earlier results.

| Workstream | Scope and acceptance |
| --- | --- |
| Architecture, API and SSR | Check exports and declarations, package dependency boundaries, compatibility entry points, SSR, and controller setup and teardown. Use the contract tests and packed consumers. |
| Components and accessibility | Reconcile the canonical catalog against fixture, interaction and coverage tests. Exercise the production showcases and record native Safari, VoiceOver and NVDA runs. |
| Visual quality | Use approved stored images and the pinned hosted renderer. Run Vue/Vanilla screenshot and behavior comparisons at existing thresholds. |
| Performance | Check package and consumer budgets, single-import tree shaking and showcase startup against the production builds. |
| Security and packaging | Audit the clean lockfile, build and inspect all seven archives, compare repeated builds, and install tarballs with npm, pnpm and Yarn. |
| Documentation | Reconcile consumer guides, migration, package metadata and release notes for the proposed stable versions. |
| Release and recovery | Review the final SHA, CI and remaining gates. Apply the existing publication and rollback procedure after owner approval. |

The [task queue](TASK_QUEUE.md) gives verification and dependencies. The
[component coverage matrix](COMPONENT_COVERAGE.md), [quality gates](QUALITY_GATES.md),
[decisions](DECISIONS.md) and [known issues](KNOWN_ISSUES.md) carry the evidence forward.
Record the exact handoff and restart point in [final readiness](FINAL_READINESS.md).

Follow the [release checklist](../release-checklist.md) and
[package dependency order](../architecture/package-topology-and-releases.md#release-order)
for final publication. After approval, publish one package at a time and check the registry before
publishing dependants. If a published version fails, halt that sequence and follow the checklist's
dist-tag rollback and patch procedure.
