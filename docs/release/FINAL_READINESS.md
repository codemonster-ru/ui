# CodeMonster UI 2.0 readiness

**BLOCKED.** The stable candidate awaits native VoiceOver and Windows NVDA acceptance, and
the npm organization owner must verify Trusted Publishing and arrange the Icons and Layouts
bootstrap. See the [quality gates](QUALITY_GATES.md) for the status of each release check.

The preparation branch is [draft PR 29](https://github.com/codemonster-ru/ui/pull/29). The last
product change is `2da9ff4e5100da24d80a9c9080ea5245bd1d249e`. Use the draft PR head to select the candidate, and match that
SHA to the `workflow_dispatch` run in [GitHub Actions](https://github.com/codemonster-ru/ui/actions/workflows/ci.yml?branch=codex%2Fprepare-ui-2.0.0).
The default branch remains at the intake revision `857c0e396077a7703a6b0b28c7c731fdb7f7befb`;
it now has active deletion and force-push protection.

## Evidence to retain

The original status, index digest, changed-file hashes, npm and CI results, browser logs and
artifact checksums are recorded under `artifacts/release-2.0.0-20261119` in the original checkout.
Use the latest evidence with the candidate's exact SHA. Earlier logs and tarballs remain
available for diagnosis against their recorded revisions.

## Restart

Open [draft PR 29](https://github.com/codemonster-ru/ui/pull/29) or the preparation checkout in
the evidence directory's `worktree-path` file. Check `git status --short --branch`,
`git rev-parse HEAD` and the exact workflow result. Continue the first eligible
[task](TASK_QUEUE.md). Run the native reader script on both production adapters and record
speech, focus and platform versions. Follow the [release checklist](../release-checklist.md)
after the release is accepted and the owner authorizes publication.
