# CodeMonster UI 2.0 readiness

**NOT_READY.** The release preparation branch is based on the approved showcase and awaits
qualification of the stable package cohort.

The original branch was `main` at `857c0e396077a7703a6b0b28c7c731fdb7f7befb`.
The dedicated preparation branch is `codex/prepare-ui-2.0.0`, based on
`d2057806365725c58e72d419e3193cfa17d5c46e`. The original status, staging digest
and changed-file hashes are recorded under `artifacts/release-2.0.0-20261119` in the original
checkout.

## Restart

Open the preparation checkout recorded in the evidence directory's `worktree-path` file.
Run `git status --short --branch` and `git rev-parse HEAD`, then continue the first eligible
[task](TASK_QUEUE.md). Use the [gate table](QUALITY_GATES.md) for the required evidence and
the [release checklist](../release-checklist.md) for publication and recovery.
