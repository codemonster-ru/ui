# CodeMonster UI 2.0 quality gates

| Gate | Status | Evidence or required result |
| --- | --- | --- |
| Approved product presentation | VERIFIED | [Design approval](../verification/visual-excellence-design-review.md) at `a9ab85e50a09ebf051f5749c9c394cf463f6de1c`; the documentation follow-up is the preparation base. |
| Clean install, dependency graph and audit | VERIFIED | Node 24.19.0 with npm 11.17.0. The stable lockfile passed `npm ci`, `npm ls --all`, production audit (0) and full audit (3 low, 17 moderate, 0 high/critical). |
| Build, tests, lint, types and docs | NOT VERIFIED | Both production builds, focused regressions and budget checks passed after the product fixes. Verify the complete chain on the reviewed release commit. |
| SSR, packed consumers, package budgets and reproducibility | NOT VERIFIED | Verify the seven exact stable archives and capture checksums. |
| Canonical accessibility and interaction | NOT VERIFIED | Repeat automated checks on the candidate; exercise both production adapters. |
| Pinned visual comparison | NOT VERIFIED | Match exact hosted SHA; retain thresholds and approved images. |
| Manual assistive technology | BLOCKED | Native Safari exercise covered keyboard interaction and the accessibility tree on both adapters. VoiceOver speech and Windows NVDA remain unverified. [Native acceptance evidence](../verification/reference-integration.md#native-acceptance) |
| Default branch protection | VERIFIED | GitHub returned `protected: true` for `main` with active deletion and non-fast-forward rules. [Ruleset](https://github.com/codemonster-ru/ui/rules/27567434) |
| Trusted Publishing | BLOCKED | npm authentication is unavailable. Icons and Layouts have no npm package records and need an owner-approved first-publication bootstrap. Verify configuration for all seven before tagged publication. |
| Final hosted CI | NOT VERIFIED | Match the reviewed release commit's SHA to a successful [CI run on `main`](https://github.com/codemonster-ru/ui/actions/workflows/ci.yml?query=branch%3Amain) and record it in the release handoff. |
| Registry and provenance | NOT APPLICABLE | The internal candidate uses local tarballs. These gates apply after authorized publication. |
