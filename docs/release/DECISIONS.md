# CodeMonster UI 2.0 release decisions

## Preparation base

Use the integration branch from [PR 27](https://github.com/codemonster-ru/ui/pull/27)
at `d2057806365725c58e72d419e3193cfa17d5c46e`. It carries the approved showcase and
had eight passing PR jobs at intake. The separate precision branch has a different tree,
pending baseline work and a failed hosted result. Preserve the original dirty `main` checkout and
both existing PRs. Review any changes imported from another branch individually.

## Verification

Retain the existing full hosted CI and approved image thresholds. Use an ordinary branch
workflow dispatch and a draft integration PR for exact-SHA verification. Follow the existing
release security audit. The older temporary Picomatch exception belongs to the precision branch
and its reviewed scope. [GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)

Use the stable version in the draft candidate package metadata so the archive and dependency
resolution tests exercise the intended publication versions. Package distribution, release tags
and merging require the owner's approval.
