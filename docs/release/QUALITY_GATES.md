# CodeMonster UI 2.0 quality gates

| Gate | Status | Evidence or required result |
| --- | --- | --- |
| Approved product presentation | VERIFIED | [Design approval](../verification/visual-excellence-design-review.md) at `a9ab85e50a09ebf051f5749c9c394cf463f6de1c`; the documentation follow-up is the preparation base. |
| Clean install, dependency graph and audit | NOT VERIFIED | Repeat using Node 24 and npm 11.17.0 on the proposed stable candidate. |
| Build, tests, lint, types and docs | NOT VERIFIED | Complete the repository verification chain plus both production showcase builds. |
| SSR, packed consumers, package budgets and reproducibility | NOT VERIFIED | Verify the seven exact stable archives and capture checksums. |
| Canonical accessibility and interaction | NOT VERIFIED | Repeat automated checks on the candidate; exercise both production adapters. |
| Pinned visual comparison | NOT VERIFIED | Match exact hosted SHA; retain thresholds and approved images. |
| Manual assistive technology | NOT VERIFIED | Native Safari and VoiceOver, plus NVDA on Windows. |
| Default branch protection | BLOCKED | GitHub returned `protected: false` and no effective rules on `main` on 19 November 2026. Establish the expected protection before final release. |
| Trusted Publishing | NOT VERIFIED | Verify the publisher configuration for each in-scope package before publication. |
| Final hosted CI | NOT VERIFIED | [PR 27](https://github.com/codemonster-ru/ui/pull/27) checks cover the starting point. Dispatch the full workflow on the final preparation branch SHA. |
| Registry and provenance | NOT APPLICABLE | The internal candidate uses local tarballs. These gates apply after authorized publication. |
