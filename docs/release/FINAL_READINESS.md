# CodeMonster UI 2.0 readiness

The 2.0 preparation from [PR #29](https://github.com/codemonster-ru/ui/pull/29) is integrated into
`main`. The [reference integration record](../verification/reference-integration.md) covers the
combined product.

**BLOCKED.** The stable candidate awaits native VoiceOver and Windows NVDA acceptance, and
the npm organization owner must verify Trusted Publishing and arrange the Icons and Layouts
bootstrap. See the [quality gates](QUALITY_GATES.md) for the status of each release check.

## Restart

Start from a clean checkout of the release commit on `main`. Record its SHA (`git rev-parse HEAD`)
and the matching [GitHub Actions result on `main`](https://github.com/codemonster-ru/ui/actions/workflows/ci.yml?query=branch%3Amain).
Continue the first eligible [task](TASK_QUEUE.md). Run the native reader script on both
production adapters and record speech, focus and platform versions. Follow the
[release checklist](../release-checklist.md) after the release is accepted and the owner
authorizes publication.

## Original PR #29 handoff

At intake, `main` was at `857c0e396077a7703a6b0b28c7c731fdb7f7befb`. The preparation branch used
the approved showcase integration from [PR #27](https://github.com/codemonster-ru/ui/pull/27).
Its last product change before the handoff was `2da9ff4e5100da24d80a9c9080ea5245bd1d249e`.

The original status, index digest, changed-file hashes, npm and CI results, browser logs and
artifact checksums are recorded under `artifacts/release-2.0.0-20261119` in the original checkout.
Match logs and tarballs to the exact SHA recorded in the evidence.
