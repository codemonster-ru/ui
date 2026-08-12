# CodeMonster UI prerelease preparation

Status: Prepared, not published  
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

## Publication boundary

Preparation does not complete `CMUI-158`. Completion requires the exact candidates to be available
from their public registries, followed by fresh registry-only installation and integrity checks.
At preparation time the npm packages did not exist publicly and the local npm client had no
authenticated publisher session. The Composer ZIP likewise had no configured public package
repository. No roadmap checkbox is advanced until those external results exist.
