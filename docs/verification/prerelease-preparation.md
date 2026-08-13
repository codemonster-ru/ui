# CodeMonster UI prerelease preparation

Status: Published and registry-validated
Date: 2026-08-13  
Roadmap item: `CMUI-158`

## Candidate

The first coordinated consumer-validation candidate is `1.0.0-rc.1`. The npm packages use the
`next` distribution tag and the Composer consumer uses the compatible `^1.0.0-rc.1` constraint.

The candidate contains:

- `@codemonster-ru/ui-tokens@1.0.0-rc.1`;
- `@codemonster-ru/ui-runtime@1.0.0-rc.1`;
- `@codemonster-ru/ui-css@1.0.0-rc.1`;
- `@codemonster-ru/ui-utilities@1.0.0-rc.1`;
- `@codemonster-ru/ui-vue@1.0.0-rc.1`;
- `codemonster-ru/ui@1.0.0-rc.1`.

The synchronized number represents the first cross-package release candidate. It does not replace
the accepted independent SemVer policy for later package changes.

## Verification

All Node.js checks ran on the supported `24.15.0` floor.

- Package metadata, built export targets, release-tag parsing, and the Razor asset graph passed.
- npm 11.9.0, pnpm 10.34.5, and Yarn 1.22.22 each installed the five exact npm tarballs in a fresh
  consumer and passed TypeScript, Vite production build, Node SSR, runtime imports, and CSS graph
  checks.
- Composer created `codemonster-ui-1.0.0-rc.1.zip`, installed the extracted archive without a
  workspace symlink, passed PHPStan, 133 PHPUnit tests with 305 assertions, strict consumer
  validation, provider discovery, component rendering, and asset publication.

## Publication result

All five npm candidates were published at exact version `1.0.0-rc.1` with the `next` distribution
tag and the repository tag workflow configured as their trusted publisher. Matching GitHub
prereleases were created for each package.

The Composer candidate was split from `packages/razor` into the public read-only
`codemonster-ru/ui` repository. Its `v1.0.0-rc.1` tag resolves through Packagist to split commit
`22e423f3974cf96d5f5634c97e562bce1df63714`, and the Packagist GitHub webhook is active.

Fresh registry-only installation and the real Annabel consumer checks are recorded in
[Real consumer prerelease rehearsal](./real-consumer-rehearsal.md). These results complete
`CMUI-158`.
