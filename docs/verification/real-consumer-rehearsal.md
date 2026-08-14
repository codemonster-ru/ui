# Real consumer prerelease rehearsal

Status: npm and Composer registries validated
Date: 2026-08-13  
Roadmap item: `CMUI-159`

## Consumer

The final local rehearsal used the real Annabel CMS application at Annabel commit
`1b6d1fbf88e7a82a72c27d6eb47153c2b1cfbe1b`. The application consumes exact local npm archives for
CodeMonster UI tokens, CSS, and Vue, and the local Composer package `codemonster-ru/ui` at
`1.0.0-rc.1`. No package was published and no registry credentials were used.

The completed source audit reports zero replace, compose, or manual findings. The remaining 12
findings are the explicitly retained `@codemonster-ru/vueforge-icons` package, for which the
migration policy defines no CodeMonster UI replacement.

## Vue admin rehearsal

The approved codemod was followed by a complete application migration. Direct portable components
use `@codemonster-ru/ui-vue`; application-owned shells, navigation, menus, tables, form layout,
date-time/number/password behavior, and tab-panel composition remain local where the stable shared
contract intentionally does not own application policy.

Both production entrypoints pass with Vite 8.0.16:

- Annabel Admin: 69 transformed modules and a verified 225.19 kB / 65.76 kB gzip entry bundle;
- Annabel Setup: 39 transformed modules and a verified 214.60 kB / 62.45 kB gzip entry bundle.

The npm production dependency audit reports zero vulnerabilities. Local Node 24.14.0 remains one
patch below the package engine gate of 24.15.0, so the final release verification must run on a
supported Node line.

## Razor consumer gap

Annabel now has a real CMS Razor consumer at
`app/Modules/Pages/views/show.razor.php`. The application registers the CodeMonster UI component
provider, publishes its assets through the CMS boundary, and renders the public page with `cm-*`
markup.

Application verification passed locally:

- PHPUnit: 68 tests, 182 assertions;
- PHPStan: no errors with a 512 MiB analysis limit;
- HTTP smoke: `/`, `/admin/login`, `/admin/forgot-password`, and `/setup` return 200;
- public Razor output contains CodeMonster UI markup.

This completes the local scope of `CMUI-159` and the contract-feedback work in `CMUI-160`.

## npm registry repeat

The npm half of `CMUI-159a` passed against the exact public `1.0.0-rc.1` versions of
`@codemonster-ru/ui-tokens`, `@codemonster-ru/ui-css`, and `@codemonster-ru/ui-vue`. The Annabel CMS
manifest and lock file contain registry versions and registry tarball integrity values instead of
local `file:` archives.

Verification passed with Node 24.19.0:

- clean npm installation and production dependency audit with zero vulnerabilities;
- Annabel Admin production build with 69 transformed modules and a verified
  225.19 kB / 65.76 kB gzip entry bundle;
- Annabel Setup production build with 39 transformed modules and a verified
  214.60 kB / 62.45 kB gzip entry bundle;
- complete Annabel quality gate, including 68 CMS tests with 182 assertions and PHPStan with no
  errors.

All five active npm packages are published at `1.0.0-rc.1`, use the `next` distribution tag, have
the repository release workflow configured as their trusted publisher, and have matching GitHub
prereleases. The npm registry retains an unavoidable `latest` alias while each new package has only
its bootstrap prerelease; stable `1.0.0` will replace it during the stable release.

## Composer registry repeat

The Composer half of `CMUI-159a` passed against public Packagist package
`codemonster-ru/ui@v1.0.0-rc.1`. The release is generated from `packages/razor` in the Vueforge
monorepo and published through the read-only `codemonster-ru/ui` split repository. Annabel commit
`2b01e3f` removes the Vueforge path repository and its Docker mounts; Composer resolves the package
to split commit `22e423f3974cf96d5f5634c97e562bce1df63714` and installs its GitHub archive.

The complete Annabel quality gate then passed with the Packagist package:

- strict Composer manifest, package, architecture, API, hygiene, and release checks;
- all package tests and static-analysis gates;
- Annabel ecosystem acceptance;
- CMS npm installation and production admin build;
- 68 CMS tests with 182 assertions;
- CMS PHPStan and dependency security audits.

Together with the npm registry repeat, this completes `CMUI-159a`.

## Stable registry validation

CodeMonster UI 1.0 was published from monorepo commit
`3d1b17bff3459c780b62c240dc7fcbe1d965590b`. The npm registry now serves stable `1.0.0` releases
of `@codemonster-ru/ui-tokens`, `@codemonster-ru/ui-runtime`, `@codemonster-ru/ui-css`,
`@codemonster-ru/ui-utilities`, and `@codemonster-ru/ui-vue` under the `latest` distribution tag.
Each release workflow passed the complete repository verification gate, and registry metadata was
checked for the expected version, integrity, and shasum.

The Composer split workflow published `codemonster-ru/ui@v1.0.0` through Packagist from split
commit `20349a7ba55f478a2dd74741ba2b61fccf0e6f9e`. Its GitHub release and package tag resolve to the
same split commit.

Annabel commit `2216f5a` upgrades the real Vue admin and Razor CMS consumer from the registry
prereleases to the stable npm and Composer constraints. Verification passed with:

- exact npm `1.0.0` registry tarballs and zero production audit vulnerabilities;
- the Admin production build with 69 transformed modules and a verified
  225.19 kB / 65.76 kB gzip entry bundle;
- 68 CMS tests with 182 assertions;
- PHPStan with no errors and Composer security audits with no advisories;
- 43 Composer UI assets published through the CMS application boundary.

This completes the stable publication and real-consumer gate in `CMUI-162` and `CMUI-G007`.

## Repository transition validation

After all release, consumer, and CI gates passed, the monorepo was renamed from
`codemonster-ru/vueforge` to `codemonster-ru/codemonster-ui`. Validation confirmed that:

- the old GitHub repository URL responds with a permanent redirect to the canonical URL;
- `main`, the stable `ui/v1.0.0` tag, GitHub releases, and completed Actions runs remain available;
- the local `origin` uses the canonical repository URL;
- package metadata uses the canonical repository, issue, and package-homepage URLs;
- all five npm trusted publishers authorize `release-from-tag.yml` in
  `codemonster-ru/codemonster-ui` for future publishes.

This completes the repository transition in `CMUI-164` and the M7 roadmap milestone.
