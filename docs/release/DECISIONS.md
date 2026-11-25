# CodeMonster UI 2.0 release decisions

This record describes the original PR #29 preparation. Start current release verification from
the [readiness report](FINAL_READINESS.md#restart).

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

## Product fixes and repository protection

Carry the AdminShell and AdminLayout focus correction and its SSR guidance from the precision
branch. The focused regression reproduced on the approved integration base before the fix.
In the Vanilla showcase, bundle the same public token, font and component styles once per
preview. Chromium had exhausted requests while loading the same import tree across iframes.
The last product change is `2da9ff4e5100da24d80a9c9080ea5245bd1d249e`.

GitHub now prevents force-pushes and deletion on `main` through the active
[main history ruleset](https://github.com/codemonster-ru/ui/rules/27567434).
