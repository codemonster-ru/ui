# CodeMonster UI 2.0 task queue

| ID | Priority | Status | Scope and acceptance | Verification | Dependencies |
| --- | --- | --- | --- | --- | --- |
| REL-01 | P0 | DONE | Isolate the preparation branch, identify the approved starting point and preserve the original checkout. | Compare local and hosted refs, PR status, and record file and index digests. | |
| REL-02 | P0 | DONE | Clean lockfile and release audit with zero production advisories and a passing high/critical gate. | `npm ci`, `npm ls --all`, `npm run audit:release`. | REL-01 |
| REL-03 | P1 | DONE | Preserve the Vue Skeleton root as minimum height changes, retaining its authored CSS and SSR output. | Reproduce root replacement, then run Vue tests, types, and packed SSR. | REL-01 |
| REL-04 | P1 | DONE | Validate stable versions, changelogs, public exports, dependency ranges, SSR and compatibility for the seven packages. | Release preparation tests, clean install and package/contract checks. | REL-01 |
| REL-05 | P1 | IN_PROGRESS | Build, inspect and independently consume all seven tarballs. Verify repeatable artifacts and size budgets. | Packed consumers with npm, pnpm and Yarn, tree shaking, package budgets, repeat-pack digests. | REL-03, REL-04 |
| REL-06 | P1 | IN_PROGRESS | Verify canonical component coverage, Vue/Vanilla browser behavior, and strict images at the accepted thresholds. | Fixture and accessibility gates, production showcase regressions, exact-SHA hosted visual job. | REL-03, REL-04 |
| REL-07 | P1 | BLOCKED | Complete native Safari and manual screen reader checks on both built adapters. | Run the RC.2 manual script with VoiceOver and NVDA; record speech, focus, platform and browser versions. | REL-06 |
| REL-08 | P1 | BLOCKED | Verify default branch protections and Trusted Publishing readiness. | Inspect effective rules and per-package npm publisher configuration. | REL-01 |
| REL-09 | P2 | IN_PROGRESS | Verify installation, API, theming, SSR, migration and release documentation. | Documentation lint, example typechecks and release preparation tests. | REL-04 |
| REL-10 | P0 | BLOCKED | Obtain full hosted CI for the exact candidate and complete the final audit. | Match the CI run's head SHA and results to the reviewed release commit and artifact hashes. Manual and registry prerequisites remain open. | REL-02 through REL-09 |
| REL-11 | P0 | BACKLOG | Secure owner approval for publication, then verify the registry cohort. | Follow the release checklist and record each package's registry integrity and smoke results. | REL-10 |

## Candidate fixes

| ID | Priority | Status | Scope and acceptance | Verification | Dependencies |
| --- | --- | --- | --- | --- | --- |
| REL-12 | P1 | DONE | Keep keyboard focus visible in sticky AdminShell and AdminLayout on both adapters. | The targeted 320 px Chromium run went from 0/32 to 32/32 across both adapters, header heights, text scales and scroll topologies. | REL-01 |
| REL-13 | P1 | DONE | Restore script and stylesheet loading in the Vanilla layouts catalog when several frames load together. | Five cold Chromium runs loaded all seven layout frames without request failures and selected the AppShell aside tab. The full browser matrix belongs to REL-06. | REL-01 |
